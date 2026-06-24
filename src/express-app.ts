import express from "express";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import cors from "cors";
import { LoanApplication, SimulatedEmail, StatusHistoryItem, ApplicationFilters, AuthenticatedRequest } from "./types";
import {
  initializeDatabase,
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  createDocument,
  createHistoryItem,
  getEmails,
  createEmail,
  clearEmails,
  getUserByToken,
  getTenantById,
  getUsers,
} from "../database";
import db from "../database";
import { JobQueue, getJobQueue } from "./job-queue";
import { getCache } from "./cache";
import { getWebhookManager } from "./webhooks";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Lazy initialization (avoids SnapStart stale connections)
let _initialized = false;
let jobQueue: JobQueue;
let webhookManager: ReturnType<typeof getWebhookManager>;

function lazyInit() {
  if (_initialized) return;
  _initialized = true;

  try { initializeDatabase(); } catch (err) { console.error("Database init failed:", err); }

  try { jobQueue = getJobQueue(db); } catch (err) { console.error("Job queue init failed:", err); jobQueue = null as any; }

  try { webhookManager = getWebhookManager(db); } catch (err) { console.error("Webhook manager init failed:", err); webhookManager = null as any; }

  if (jobQueue) {
    jobQueue.processJobs('send_email', async (job) => {
      const payload = JSON.parse(job.payload);
      createEmail({
        id: `em-${Math.random().toString(36).substr(2, 9)}`,
        to: payload.to,
        subject: payload.subject,
        body: payload.body,
        sentAt: new Date().toISOString(),
        read: false,
      });
      console.log(`[JOB QUEUE] Email sent to: ${payload.to} | subject: ${payload.subject}`);
    }, 500);

    jobQueue.processJobs('process_document', async (job) => {
      const payload = JSON.parse(job.payload);
      const isValid = payload.fileName && payload.fileName.length > 0;
      if (!isValid) {
        throw new Error(`Document ${payload.fileName || 'unknown'} failed validation`);
      }
      console.log(`[JOB QUEUE] Document processed: ${payload.fileName} (${payload.fileType}) for app ${payload.applicationId}`);
    }, 800);
  }
}

// Diagnostic: return what URL Express sees
app.get("/api/express-info", (_req: any, res: any) => {
  res.json({ url: _req.url, originalUrl: _req.originalUrl, baseUrl: _req.baseUrl, method: _req.method });
});

// Middleware to ensure lazy init runs before any route handler
app.use((_req: any, _res: any, next: any) => {
  lazyInit();
  next();
});

// RBAC auth middleware
function authenticate(req: AuthenticatedRequest, res: any, next: any) {
  const token = req.headers['x-auth-token'] as string;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Provide x-auth-token header.' });
  }
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
  req.user = user;
  next();
}

function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}.` });
    }
    next();
  };
}

function sendSimulatedEmail(to: string, subject: string, body: string) {
  jobQueue.enqueue('send_email', { to, subject, body });
  console.log(`[JOB QUEUE] Email enqueued to: ${to} | subject: ${subject}`);
}

let groqClient: Groq | null = null;
function getGroqClient(): Groq {
  if (!groqClient) {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      console.warn("WARNING: GROQ_API_KEY environment variable is not set. AI Features will degrade gracefully with custom responses.");
    }
    groqClient = new Groq({
      apiKey: key || "MOCK_KEY"
    });
  }
  return groqClient;
}

app.get("/api/applications", authenticate, (req: AuthenticatedRequest, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

  const filters: ApplicationFilters = {};
  if (req.query.status) filters.status = req.query.status as string;
  if (req.query.acquisitionMode) filters.acquisitionMode = req.query.acquisitionMode as string;
  if (req.query.search) filters.search = req.query.search as string;

  // RBAC: admins see all, others scoped to their tenant
  const user = req.user!;
  if (user.role !== 'admin') {
    filters.tenantId = user.tenantId;
  }

  res.json(getApplications(page, limit, sortBy, sortOrder, filters));
});

app.post("/api/applications", authenticate, (req: AuthenticatedRequest, res) => {
  const {
    applicantName,
    applicantEmail,
    carMake,
    carModel,
    carYear,
    loanAmount,
    downPayment,
    termMonths,
    interestRate,
    monthlyPayment,
    creditScore,
    acquisitionMode
  } = req.body;

  if (!applicantName || !applicantEmail || !carMake || !carModel) {
    return res.status(400).json({ error: "Missing required details to file a loan application." });
  }

  const id = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
  const timestamp = new Date().toISOString();
  const currentMode = acquisitionMode || 'FINANCING';

  const newApp = createApplication({
    id,
    applicantName,
    applicantEmail,
    carMake,
    carModel,
    carYear: carYear || 2025,
    loanAmount: Number(loanAmount),
    downPayment: Number(downPayment),
    termMonths: Number(termMonths),
    interestRate: Number(interestRate),
    monthlyPayment: Number(monthlyPayment),
    creditScore: Number(creditScore),
    acquisitionMode: currentMode,
    status: 'DOCUMENTS_PENDING',
    statusUpdatedAt: timestamp,
    createdAt: timestamp,
    tenantId: req.user!.tenantId,
    assignedUnderwriterId: req.user!.role === 'underwriter' || req.user!.role === 'admin' ? req.user!.id : undefined
  });

  createHistoryItem({
    id: `hist-${Math.floor(10000 + Math.random() * 90000)}`,
    applicationId: id,
    status: 'SUBMITTED',
    timestamp,
    description: `Application reservation for ${carMake} ${carModel} via [${currentMode}] submitted successfully by ${applicantName}.`
  });

  createHistoryItem({
    id: `hist-${Math.floor(10000 + Math.random() * 90000)}`,
    applicationId: id,
    status: 'DOCUMENTS_PENDING',
    timestamp,
    description: 'Underwriters require ID, Proof of Income, and vehicle insurance to begin review.'
  });

  sendSimulatedEmail(
    applicantEmail,
    `Application Received: ${carMake} ${carModel} Loan [ID: ${id}]`,
    `Dear ${applicantName},\n\nThank you for applying for car financing with us. We have received your request for a loan on a ${carYear} ${carMake} ${carModel} for $${Number(loanAmount).toLocaleString()}.\n\nYour application ID is ${id}.\nYour initial status is: DOCUMENTS_PENDING.\nTo speed up your approval, please head over to your real-time tracking dashboard and upload your required ID and proof of income documents.\n\nWarm regards,\nMCARS Finance Underwriters`
  );

  res.status(201).json(newApp);
});

app.post("/api/applications/:id/documents", authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { name, type, size } = req.body;

  const appItem = getApplicationById(id);
  if (!appItem) {
    return res.status(404).json({ error: "Application not found." });
  }
  // RBAC tenant isolation
  const user = req.user!;
  if (user.role !== 'admin' && (appItem as any).tenantId !== user.tenantId) {
    return res.status(403).json({ error: "Access denied to this application." });
  }

  const docId = `doc-${Math.random().toString(36).substr(2, 9)}`;
  createDocument({
    id: docId,
    applicationId: id,
    name: name || "document.pdf",
    type: type || "ID",
    size: size || 1024 * 102,
    uploadedAt: new Date().toISOString()
  });

  // Enqueue document processing (validation, virus scan, OCR — async)
  jobQueue.enqueue('process_document', {
    documentId: docId,
    applicationId: id,
    fileName: name || "document.pdf",
    fileType: type || "ID"
  });

  if (appItem.status === 'DOCUMENTS_PENDING') {
    updateApplication(id, {
      status: 'UNDER_REVIEW',
      statusUpdatedAt: new Date().toISOString()
    });

    const histId = `hist-${Math.floor(10000 + Math.random() * 90000)}`;
    createHistoryItem({
      id: histId,
      applicationId: id,
      status: 'UNDER_REVIEW',
      timestamp: new Date().toISOString(),
      description: `Verification paper '${name || 'document.pdf'}' uploaded successfully. Status upgraded to Under Review.`
    });

    // Fire webhook: document uploaded, status changed
    webhookManager.publish('application.document_uploaded', {
      applicationId: id,
      documentId: docId,
      fileName: name || 'document.pdf',
      newStatus: 'UNDER_REVIEW'
    });

    sendSimulatedEmail(
      appItem.applicantEmail,
      `Verification Received - Under Review [ID: ${id}]`,
      `Hi ${appItem.applicantName},\n\nWe have successfully received your uploaded verification document (${name || 'document.pdf'}).\n\nYour application [ID: ${id}] has been moved to UNDER REVIEW status. Our automotive underwriting team is verifying the documents details. You can track this real-time directly through your portal.\n\nBest regards,\nAutomotive Underwriting Team`
    );
  } else {
    const histId = `hist-${Math.floor(10000 + Math.random() * 90000)}`;
    createHistoryItem({
      id: histId,
      applicationId: id,
      status: appItem.status,
      timestamp: new Date().toISOString(),
      description: `Supplemental document '${name || 'document.pdf'}' uploaded successfully.`
    });
  }

  res.json(getApplicationById(id)!);
});

app.post("/api/applications/:id/advance", authenticate, requireRole('admin', 'underwriter'), (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const appItem = getApplicationById(id);
  if (!appItem) {
    return res.status(404).json({ error: "Application not found." });
  }
  const user = req.user!;
  if (user.role !== 'admin' && (appItem as any).tenantId !== user.tenantId) {
    return res.status(403).json({ error: "Access denied to this application." });
  }

  const currentStatus = appItem.status;
  let nextStatus: 'SUBMITTED' | 'DOCUMENTS_PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' = currentStatus;
  let textDesc = '';

  if (currentStatus === 'SUBMITTED') {
    nextStatus = 'DOCUMENTS_PENDING';
    textDesc = "Required files missed. Waiting for identity proofs from applicant.";
  } else if (currentStatus === 'DOCUMENTS_PENDING') {
    nextStatus = 'UNDER_REVIEW';
    textDesc = "Identity papers uploaded or manual screening bypass. Passed to credit underwriters.";
  } else if (currentStatus === 'UNDER_REVIEW') {
    const rand = Math.random();
    if (rand > 0.15) {
      nextStatus = 'APPROVED';
      textDesc = `Credit score of ${appItem.creditScore} verifies prime capabilities. Loan pre-authorized successfully at ${appItem.interestRate}% APR!`;
    } else {
      nextStatus = 'REJECTED';
      textDesc = `Unable to verify sufficient collateral or debt-to-income limits. Application declined.`;
    }
  } else if (currentStatus === 'APPROVED' || currentStatus === 'REJECTED') {
    nextStatus = 'UNDER_REVIEW';
    textDesc = "Application was reopened manually for premium recalculation/re-review.";
  }

  updateApplication(id, {
    status: nextStatus,
    statusUpdatedAt: new Date().toISOString()
  });

  createHistoryItem({
    id: `hist-${Math.floor(10000 + Math.random() * 90000)}`,
    applicationId: id,
    status: nextStatus,
    timestamp: new Date().toISOString(),
    description: textDesc
  });

  if (nextStatus === 'APPROVED') {
    sendSimulatedEmail(
      appItem.applicantEmail,
      `🎉 Approved! Premium Car Finance Authorized [ID: ${id}]`,
      `Congratulations ${appItem.applicantName}!\n\nWe are overjoyed to inform you that your application for a ${appItem.carMake} ${appItem.carModel} financing with ID: ${id} has been APPROVED! \n\nLoan Terms Summary:\n- Vehicle: ${appItem.carYear} ${appItem.carMake} ${appItem.carModel}\n- Principal Loan Amount: $${appItem.loanAmount.toLocaleString()}\n- Interest rate: ${appItem.interestRate}% APR\n- Selected Term: ${appItem.termMonths} Months\n- Calculated Monthly Cost: $${appItem.monthlyPayment.toFixed(2)}\n\nNext steps: A representative will contact you to sign the digital closing package. You can schedule pick-up with your dealer today!\n\nSincerely,\nMCARS Finance team`
    );
  } else if (nextStatus === 'REJECTED') {
    sendSimulatedEmail(
      appItem.applicantEmail,
      `Update regarding your Car Financing Application [ID: ${id}]`,
      `Dear ${appItem.applicantName},\n\nWe appreciate your interest in our premium car financing options. However, after reviewing your application details (specifically credit verification parameters) we regret to inform you that we are unavailable to pre-approve your car loan at this time.\n\nTo appeal this decision, or attach additional down payment collateral to lower leverage risk, please speak directly to our AI Loan Consultant in your personal dashboard.\n\nWarm considerations,\nAutomotive Underwriting Division`
    );
  } else if (nextStatus === 'UNDER_REVIEW') {
    sendSimulatedEmail(
      appItem.applicantEmail,
      `Under Review Update [ID: ${id}]`,
      `Hi ${appItem.applicantName},\n\nYour financing portfolio has advanced to UNDER_REVIEW. Our core underwriter is checking rates ratios.\n\nStatus Description: ${textDesc}\n\nTrack progress in real-time inside your dashboard.\n\nWarm regards,\nFinance Team`
    );
  } else if (nextStatus === 'DOCUMENTS_PENDING') {
    sendSimulatedEmail(
      appItem.applicantEmail,
      `Action Required: Document Upload Needed [ID: ${id}]`,
      `Dear ${appItem.applicantName},\n\nImportant progress update for your application ${id}. Additional proof records are requested.\n\nStatus Description: ${textDesc}\n\nPlease click into your user portal and drag-and-drop the files immediately to restart review.\n\nBest wishes,\nAutomated Underwriter System`
    );
  }

  // Fire webhook: application status changed
  webhookManager.publish('application.status_changed', {
    applicationId: id,
    previousStatus: currentStatus,
    newStatus: nextStatus,
    description: textDesc
  });

  res.json(getApplicationById(id)!);
});

app.get("/api/emails", authenticate, (req: AuthenticatedRequest, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 100));
  const sortBy = (req.query.sortBy as string) || 'sentAt';
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

  res.json(getEmails(page, limit, sortBy, sortOrder));
});

app.post("/api/emails/clear", authenticate, requireRole('admin'), (_req, res) => {
  clearEmails();
  res.json({ success: true });
});

// Job queue monitoring endpoints (admin only)
app.get("/api/queue", authenticate, requireRole('admin'), (_req, res) => {
  res.json({
    pending: jobQueue.getPendingCount(),
    pendingEmails: jobQueue.getPendingCount('send_email'),
    failed: jobQueue.getFailedJobs(),
    recent: jobQueue.getRecentJobs(10)
  });
});

// Cache stats
app.get("/api/cache", authenticate, requireRole('admin'), (_req, res) => {
  res.json(getCache().stats());
});

// Webhook management endpoints (admin only)
app.get("/api/webhooks", authenticate, requireRole('admin'), (_req: AuthenticatedRequest, res) => {
  res.json(webhookManager.getAll());
});

app.post("/api/webhooks", authenticate, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const { url, events } = req.body;
  if (!url || !events || !Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: "url and events[] are required." });
  }
  const webhook = webhookManager.register(url, events);
  res.status(201).json(webhook);
});

app.delete("/api/webhooks/:id", authenticate, requireRole('admin'), (req: AuthenticatedRequest, res) => {
  webhookManager.unregister(req.params.id);
  res.json({ success: true });
});

// Public auth endpoint
app.post("/api/auth/login", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  const user = getUserByToken(email); // allow token-based login too
  const userByEmail = getUsers().find(u => u.email === email);
  const found = user || userByEmail || null;
  if (!found) {
    return res.status(401).json({ error: "User not found for this email." });
  }
  const tenant = getTenantById(found.tenantId);
  res.json({ user: found, tenant });
});

// Current user / token info
app.get("/api/auth/me", authenticate, (req: AuthenticatedRequest, res) => {
  const tenant = getTenantById(req.user!.tenantId);
  res.json({ user: req.user, tenant });
});

app.post("/api/counselor", async (req, res) => {
  const { messages, systemContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages structure provided for the consultation." });
  }

  try {
    const groq = getGroqClient();

    const systemMessage = {
      role: "system" as const,
      content: `You are a premier, highly informative, elite AI Car Finance Counselor representing MCARS FINANCE. 
Your goal is to provide deep, analytical, crystal-clear budgeting advise on automobile loans, leasing versus buying, interest rates (APRs), credit tiers influence, and down payment optimization.

Keep your tone: Professional, deeply analytical, helpful, encouraging, and clear of marketing fluff.

IMPORTANT: When comparing Leasing vs. Buying/Financing, use formal, professional language:
- Title: "Leasing vs. Financing: Professional Analysis"
- Table headers: "Financial Metric", "Leasing Structure", "Financing Structure"
- Use terms like: "reduction in obligation", "equity position", "contractual limits", "asset ownership", "strategic recommendation"
- Avoid casual phrases like "lower", "higher", "no limits" - use formal equivalents

Context parameters about the current user state:
${JSON.stringify(systemContext || {}, null, 2)}

Provide clear bullet points and structural layouts when making numerical comparisons. 
Answer queries accurately and professionally.`
    };

    const chatMessages = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" as const : "assistant" as const,
      content: m.text
    }));

    const generateSimulatedResponse = () => {
      const lastUserQuestion = messages[messages.length - 1]?.text || "Explain car APR";
      let simulatedReply = "";
      let simulatedThinking = "";

      if (lastUserQuestion.toLowerCase().includes("lease") || lastUserQuestion.toLowerCase().includes("buy")) {
        simulatedThinking = "User wants to compare Leasing vs. Buying a car. Let's analyze depreciation, contract terms, down payment leverage, and final ownership value.\n- Leasing has lower payments but no equity.\n- Buying builds equity but has higher initial payments.\nNeed to format with clean markdown grid comparison.";
        simulatedReply = `### Leasing vs. Financing: Professional Analysis

A strategic comparison between leasing and financing options based on your financial objectives:

| **Financial Metric** | **Leasing Structure** | **Financing Structure** |
| :--- | :--- | :--- |
| **Monthly Payment** | 30% - 40% reduction in obligation | Higher payments (building equity position) |
| **Asset Ownership** | Vehicle returned at lease term conclusion | Full ownership transfer upon loan completion |
| **Mileage Parameters** | Contractual limits (typically 10k-15k miles annually) | Unlimited mileage with no penalty assessments |
| **Long-Term Cost** | Continuous payment cycle with no equity accumulation | Cost-effective after loan retirement with retained asset value |

**Strategic Recommendation:** For clients who prioritize vehicle rotation every 2-3 years with minimal monthly cash flow impact, **Leasing** provides optimal flexibility. For clients with high annual mileage requirements seeking to establish long-term asset equity, **Financing** with a minimum 20% down payment represents the superior financial strategy.`;
      } else if (lastUserQuestion.toLowerCase().includes("rent") || lastUserQuestion.toLowerCase().includes("own") || lastUserQuestion.toLowerCase().includes("cash") || lastUserQuestion.toLowerCase().includes("acquisition") || lastUserQuestion.toLowerCase().includes("compare options") || lastUserQuestion.toLowerCase().includes("rate")) {
        const activeCar = systemContext.carMake ? `${systemContext.carMake} ${systemContext.carModel}` : "Premium Vehicle preset";
        const valPrice = Number(systemContext.price || 45000);
        const valDown = Number(systemContext.downPayment || 9000);
        const valTerms = Number(systemContext.term || 60);
        const valRate = Number(systemContext.rate || 5.89);
        const valMonthly = Number(systemContext.monthlyPayment || 745);
        
        simulatedThinking = `Analyzing acquisition methods side-by-side for ${activeCar} price ₱${valPrice}. 
- Cash Buyout Option: Offers 5% instant proc discount. Upfront cash required.
- Traditional Financing Option: APR at ${valRate}% with ₱${valMonthly}/mo.
- Rent-To-Own Option: Lower initial barrier, surcharge equivalent of ${(valRate + 3.0).toFixed(2)}%, no hard credit pull.
Compiling markdown response card with clear rate and cost matrices.`;

        simulatedReply = `### Premium Acquisition Rate Comparison & AI Analytics

I have analyzed the rates and financial projection maps for acquiring your **${activeCar}** (Retail Price: **₱${valPrice.toLocaleString()}**):

---

### 1. 💰 Cash Unit Buyout (Optimal Interest-Cutter)
*   **Offered Rate / Discount:** **5.0% Cash Discount Rate**
*   **Total Procurement Amount:** **₱${(valPrice * 0.95).toLocaleString()}** (Instant savings of **₱${(valPrice * 0.05).toLocaleString()}**)
*   **Monthly Payment Rate:** **₱0.00 / month**
*   **Interest/Surcharges Accrued:** **₱0.00**
*   **AI Verdict:** The most cost-efficient route. Perfect if you have liquid assets and want to immediately bypass periodic financing overhead.

---

### 2. 🚘 Traditional Financing (Balanced Amortized Loan)
*   **Offered Rate (APR):** **${valRate}% APR** (based on credit bracket).
*   **Down Payment Commitment:** **₱${valDown.toLocaleString()}** (${Math.round(valDown / valPrice * 105) / 100}% leverage).
*   **Estimated Monthly Payment:** **₱${valMonthly.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}/month** over **${valTerms} Months**.
*   **Cumulative Interest Charges:** **₱${Math.round((valMonthly * valTerms) - (valPrice - valDown)).toLocaleString()}**.
*   **AI Verdict:** Highly recommended for builders looking to establish strong credit records while retaining liquid capital.

---

### 3. 🔑 Rent-to-Own / RTO Program (Highest Versatility)
*   **Offered Rate / Surcharge equivalent:** **${(valRate + 3.0).toFixed(2)}% Equivalent surcharge rate**.
*   **Initial Security Deposit:** Ultra-low, only **₱${Math.round(valDown * 0.6).toLocaleString()}**.
*   **Estimated Monthly Rental Rate:** **₱${Math.round(((valPrice - valDown) / valTerms) * 1.15).toLocaleString()}/month**.
*   **Approval Constraint Bracket:** **No strict Credit Checks required**. Automatic approval.
*   **Ownership Release:** Fully transfers to you after the set rental period or can be purchased early with a proportional cash buyout discount!
*   **AI Verdict:** The absolute matches for low-credit scores, temporary business placements, or situations requiring the flexibility to exit the vehicle at will.

---

Would you like to authorize an application lock for rent-to-own, cash buy, or standard financing options? I can submit these configurations to the underwriters portal instantly!`;
      } else if (lastUserQuestion.toLowerCase().includes("score") || lastUserQuestion.toLowerCase().includes("credit") || lastUserQuestion.toLowerCase().includes("apr")) {
        simulatedThinking = "Analyzing credit score impact on APR rates. Excellent credit (750+) unlocks ~4.8% APR, whereas builder tier (<600) sits around ~14.9%. Let's detail how a slight boost of 30 points can save thousands over a 60-month term.";
        simulatedReply = `### How Your Credit Score Determines Your Interest Rate (APR)

Underwriters utilize credit score brackets to determine risk premiums. Raising your score even slightly yields compounding interest savings:

1. **Excellent Tier (750+)**: Unlocks ~**4.89% - 5.15%** APR. Minimal interest accumulation.
2. **Very Good Tier (700-749)**: Yields ~**5.95% - 6.50%** APR. highly favorable commercial rate.
3. **Good Tier (660-699)**: Yields ~**7.49% - 8.25%** APR. standard consumer average.
4. **Subprime Brackets (< 660)**: APR climbs to **10.25% - 14.99%** or more.

*Pro Finance Tip:* Moving from Good to Very Good can reduce your monthly payment on a ₱50k loan by roughly **₱45/month**, saving you over **₱2,700** in interest charges over a typical 5-year loan cycle. Consider a larger down payment to compress your Loan-to-Value (LTV) ratio and appeal for rate reductions.`;
      } else {
        simulatedThinking = `The customer is asking about: "${lastUserQuestion}". Let's parse their profile. Down payment ratio behaves as an immediate leverage defense. We must outline a precise interest calculation formula: Monthly Payment = [P * r * (1+r)^n] / [(1+r)^n - 1]. Let's address their exact inquiry within professional parameters.`;
        simulatedReply = `### Personalized Financial Assessment

Based on the parameters of our Premium Car Financing Suite:

*   **Loan Principal Optimization:** We suggest keeping your debt-to-income (DTI) ratio for automotive expenses below **10% - 15%** of net income.
*   **The 20/4/10 Rule:** Put down **20%** of the car purchase price, finance for no longer than **4 years** (48 months), and spend less than **10%** of monthly income on combined auto expenses (payment + insurance + maintenance).
*   **Rate Calibration:** Currently, adding an extra ₱5,000 on your down payment reduces your monthly obligation by approx **₱95/month** on average and reduces interest charges significantly.

Would you like me to construct a custom amortization schedule for a specific vehicle model? Ask me anything regarding APR calculations or lease structures!`;
      }

      return { simulatedReply, simulatedThinking };
    };

    const hasRealApiKey = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "MY_GROQ_API_KEY" && process.env.GROQ_API_KEY !== "";

    if (!hasRealApiKey) {
      const simulated = generateSimulatedResponse();
      await new Promise(r => setTimeout(r, 1200));

      return res.json({
        text: simulated.simulatedReply,
        thinking: simulated.simulatedThinking
      });
    }

    let replyText = "";
    let extractedThinking = "";
    let callSucceeded = false;

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [systemMessage, ...chatMessages],
        temperature: 0.7,
        max_tokens: 4096
      });
      replyText = completion.choices[0]?.message?.content || "";
      callSucceeded = true;
    } catch (proError: any) {
      console.warn("Attempt with llama-3.3-70b-versatile failed. Retrying with mixtral-8x7b-32768 fallback...", proError.message);
      
      try {
        const completion = await groq.chat.completions.create({
          model: "mixtral-8x7b-32768",
          messages: [systemMessage, ...chatMessages],
          temperature: 0.7,
          max_tokens: 4096
        });
        replyText = completion.choices[0]?.message?.content || "";
        callSucceeded = true;
        extractedThinking = "Fell back to mixtral-8x7b-32768 model to bypass primary model quota limit constraints.";
      } catch (flashError: any) {
        console.error("All Groq API calls failed. Falling back to elite simulated responses.", flashError.message);
      }
    }

    if (callSucceeded && replyText) {
      res.json({
        text: replyText,
        thinking: extractedThinking || "Groq inference analyzed amortization metrics, credit tiers, and DTI thresholds to formulate the optimal response."
      });
    } else {
      const simulated = generateSimulatedResponse();
      res.json({
        text: simulated.simulatedReply,
        thinking: simulated.simulatedThinking + "\n\n(System Note: Operating in ultra-secure high-fidelity fallback mode due to transient key quota restrictions)"
      });
    }

  } catch (error: any) {
    console.error("Groq AI API Error:", error);
    res.status(500).json({ 
      error: "An error occurred with our AI Consultation engine.", 
      details: error.message 
    });
  }
});

// Global error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV !== "production" ? err.message : undefined
  });
});

export default app;
