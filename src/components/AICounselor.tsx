import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { Sparkles, Send, BrainCircuit, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';

interface AICounselorProps {
  activeApplicationContext: any;
}

function generateSimulatedReply(lastUserQuestion: string, systemContext: Record<string, any>) {
  let simulatedReply = "";
  let simulatedThinking = "";

  if (lastUserQuestion.toLowerCase().includes("lease") || lastUserQuestion.toLowerCase().includes("buy")) {
    simulatedThinking = "User wants to compare Leasing vs. Buying a car. Let's analyze depreciation, contract terms, down payment leverage, and final ownership value.\n- Leasing has lower payments but no equity.\n- Buying builds equity but has higher initial payments.\nNeed to format with clean markdown grid comparison.";
    simulatedReply = `### Leasing vs. Buying: Comprehensive Comparison

Comparing leasing and buying is a fundamental step. Here is a curated, analytical breakdown based on your financial footprint:

| Feature | Leasing (Simulated) | Buying (Simulated) |
| :--- | :--- | :--- |
| **Monthly Payment** | 30% - 40% Lower | Higher payments (building equity) |
| **Ownership** | Vehicle returned in 2-3 years | You own the vehicle fully after payoff |
| **Mileage Limits** | Hard limit (usually 10k-15k miles/yr) | No mileage limits or penalty fees |
| **Long-term Cost** | Infinite payment cycle | Cheaper overall once loan is fully retired |

**Recommendation:** If you change cars frequently and prefer lower monthly obligations, **Lease** is highly suited. If you drive long distances annually and look to build asset equity, **Buy** with a solid down payment (at least 20%) is the financially optimal strategy.`;
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
*   **Estimated Monthly Payment:** **₱${valMonthly.toFixed(2)}/month** over **${valTerms} Months**.
*   **Cumulative Interest Charges:** **₱${Math.round((valMonthly * valTerms) - (valPrice - valDown)).toLocaleString()}**.
*   **AI Verdict:** Highly recommended for builders looking to establish strong credit records while retaining liquid capital.

---

### 3. 🔑 Rent-to-Own / RTO Program (Highest Versatility)
*   **Offered Rate / Surcharge equivalent:** **${(valRate + 3.0).toFixed(2)}% Equivalent surcharge rate**.
*   **Initial Security Deposit:** Ultra-low, only **₱${Math.round(valDown * 0.6).toLocaleString()}**.
*   **Estimated Monthly Rental Rate:** **₱${Math.round(((valPrice - valDown) / valTerms) * 1.15).toLocaleString()}/month**.
*   **Approval Constraint Bracket:** **No strict Credit Checks required**. Automatic approval.
*   **Ownership Release:** Fully transfers to you after the set rental period or can be purchased early with a proportional cash buyout discount!
*   **AI Verdict:** The absolute matches for low-credit scores, temporary business placements, or situations requiring the flexibility to exit the vehicle at risk.

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

  return { text: simulatedReply, thinking: simulatedThinking };
}

export default function AICounselor({ activeApplicationContext }: AICounselorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: "Welcome to the custom AI Underwriting suite! I have set up my high-thinking core to analyze your budgeting ratios. Ask me anything about leasing versus buying models, optimal down payment ratios, term interest amortization, or how to boost your credit tier.",
      timestamp: new Date().toLocaleTimeString(),
      thinking: "Initialized premium underwriting counseling model. User is browsing car options. Set thinking level parameters to High."
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage;
    setInputMessage('');
    setErrorText('');

    // Append user message
    const userMsg: Message = {
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString()
    };
    
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/counselor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: updatedMessages,
          systemContext: activeApplicationContext || {}
        })
      });

      if (!response.ok) {
        throw new Error("Backend unavailable");
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: data.text,
        timestamp: new Date().toLocaleTimeString(),
        thinking: data.thinking
      }]);
    } catch (_err) {
      // Client-side simulated response when no backend is available
      const reply = generateSimulatedReply(userText, activeApplicationContext || {});
      await new Promise(r => setTimeout(r, 1200));

      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: reply.text,
        timestamp: new Date().toLocaleTimeString(),
        thinking: reply.thinking
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setInputMessage(q);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-white">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:grid md:grid-cols-12 md:max-h-[640px]">
        
        {/* Left column: Quick hints and system constraints */}
        <div className="p-6 md:col-span-4 bg-neutral-950 border-r border-neutral-800 flex flex-col justify-between text-left space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-500">
              <BrainCircuit className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider font-display">High-Thinking Mode</span>
            </div>
            
            <p className="text-xs text-neutral-400 leading-relaxed">
              Equipped with <span className="text-neutral-200">llama-3.3-70b (Groq)</span>, the portal evaluates multi-variable calculations on down payments, amortization periods, and risk profiling.
            </p>

            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase block">Suggested Queries</span>
              {[
                "Is it better for me to Lease or Buy?",
                "How does my credit score bracket impact APR?",
                "Calculate optimal down payment for a ₱45k SUV",
                "What is the 20/4/10 budgeting rule?"
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(q)}
                  className="w-full text-left text-[11px] p-2 bg-neutral-900/50 hover:bg-red-950/20 border border-neutral-850 hover:border-red-500/10 text-neutral-300 hover:text-white rounded-lg transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-red-950/20 border border-red-500/10 p-3.5 rounded-xl">
            <span className="text-[10px] uppercase tracking-wider font-bold text-red-500 block mb-1">Core active context</span>
            {activeApplicationContext ? (
              <div className="font-mono text-[9px] text-neutral-400 space-y-0.5">
                <p>Client: {activeApplicationContext.applicantName}</p>
                <p>Car: {activeApplicationContext.carMake} {activeApplicationContext.carModel}</p>
                <p>Loan Amount: ₱{activeAppContextValue(activeApplicationContext.loanAmount)}</p>
                <p>Credit Bracket: {activeApplicationContext.creditScore}</p>
              </div>
            ) : (
              <p className="text-[10px] text-neutral-500">No application active. Using general benchmark rates.</p>
            )}
          </div>
        </div>

        {/* Right column: Interactive Chat Terminal */}
        <div id="ai-chat-box" className="md:col-span-8 flex flex-col justify-between h-[450px] md:h-[640px] bg-neutral-900">
          
          {/* Header */}
          <div className="bg-neutral-900/40 p-4 border-b border-neutral-800 flex justify-between items-center text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <div>
                <h4 className="text-sm font-semibold text-white">Underwriter AI Consultant</h4>
                <p className="text-[10px] text-neutral-400 font-mono">llama-3.3-70b-versatile : Groq Inference</p>
              </div>
            </div>
            
            <span className="text-[10px] text-red-500 uppercase tracking-widest font-bold">Amortized Live</span>
          </div>

          {/* Messages feed */}
          <div className="grow overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.map((m, idx) => {
              const isUser = m.sender === 'user';
              return (
                <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}>
                  
                  {/* Message bubble */}
                  <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed text-left ${
                    isUser 
                      ? 'bg-red-600 text-white rounded-tr-none shadow-md shadow-red-950/20' 
                      : 'bg-neutral-950 border border-neutral-850 text-neutral-100 rounded-tl-none'
                  }`}>
                    {/* Format simple markdown inside helper */}
                    <div className="space-y-2 prose-invert select-none">
                      {m.text.split('\n').map((line, lidx) => {
                        if (line.startsWith('### ')) {
                          return <h4 key={lidx} className="text-xs sm:text-lg font-bold font-display text-white mt-3 select-none">{line.replace('### ', '')}</h4>;
                        }
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <strong key={lidx} className="font-semibold block select-none">{line.replace(/\*\*/g, '')}</strong>;
                        }
                        return <p key={lidx} className="select-text">{line}</p>;
                      })}
                    </div>
                  </div>

                  {/* Chain of thought rendering */}
                  {!isUser && m.thinking && (
                    <details className="w-[85%] bg-neutral-950/40 border border-neutral-800/80 rounded-xl overflow-hidden group">
                      <summary className="cursor-pointer text-[10px] font-semibold text-neutral-400 hover:text-red-400 p-2.5 select-none flex items-center gap-1.5 bg-neutral-950">
                        <BrainCircuit className="w-3.5 h-3.5 text-red-500 animate-pulse group-open:rotate-18 transition-transform" />
                        <span>Inspect High-Thinking Deep Reasoning Process ({m.thinking.substring(0, 40)}...)</span>
                      </summary>
                      <div className="p-3 border-t border-neutral-900 bg-neutral-950/80 font-mono text-[10px] text-red-100/70 whitespace-pre-line text-left leading-relaxed">
                        {m.thinking}
                      </div>
                    </details>
                  )}

                  <span className="text-[9px] text-neutral-500 font-mono px-1">
                    {m.timestamp}
                  </span>
                </div>
              );
            })}

            {loading && (
              <div className="flex flex-col items-start space-y-2">
                <div className="bg-neutral-950 border border-neutral-850 rounded-2xl rounded-tl-none p-4 max-w-[85%] animate-pulse text-left">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-[10px] font-mono leading-none">AI is analyzing finance algorithms...</span>
                  </div>
                  <div className="h-1.5 bg-neutral-900 rounded w-48 mb-1.5" />
                  <div className="h-1.5 bg-neutral-900 rounded w-36" />
                </div>
              </div>
            )}

            {errorText && (
              <div className="bg-red-950/20 border border-red-500/20 p-3 rounded-xl flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>{errorText}</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Form submit bar */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-neutral-800 bg-neutral-950/40 flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
              placeholder="Ask our underwriters counselor..."
              className="grow bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white p-3 rounded-xl transition-all flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}

// Helper block
function activeAppContextValue(val: any) {
  if (!val) return '0';
  return Number(val).toLocaleString();
}
