import React, { useState, useRef } from 'react';
import { CAR_MAKES, CREDIT_TIERS } from '../data';
import { 
  User, Mail, ArrowRight, ArrowLeft, ShieldAlert, CheckCircle, 
  UploadCloud, FileText, AlertCircle, Fingerprint, RefreshCw, Smartphone
} from 'lucide-react';

interface LoanFormProps {
  preFilledConfig: {
    carMake: string;
    carModel: string;
    price: number;
    downPayment: number;
    term: number;
    rate: number;
    monthlyPayment: number;
    creditScore: number;
    acquisitionMode?: 'FINANCING' | 'RENT_TO_OWN' | 'CASH';
  } | null;
  onSubmitSuccess: (newAppId: string) => void;
}

export default function LoanForm({ preFilledConfig, onSubmitSuccess }: LoanFormProps) {
  // Stepper state
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Form Field states
  const [applicantName, setApplicantName] = useState<string>('Michael Carsen');
  const [applicantEmail, setApplicantEmail] = useState<string>('mcars.itdept@gmail.com');
  const [annualIncome, setAnnualIncome] = useState<number>(125000);
  const [employer, setEmployer] = useState<string>('Carsen Motor Co.');

  const [carMake, setCarMake] = useState<string>(preFilledConfig?.carMake || 'Tesla');
  const [carModel, setCarModel] = useState<string>(preFilledConfig?.carModel || 'Model S');
  const [carYear, setCarYear] = useState<number>(2025);
  const [price, setPrice] = useState<number>(preFilledConfig?.price || 74990);
  const [downPayment, setDownPayment] = useState<number>(preFilledConfig?.downPayment || 15000);
  const [termMonths, setTermMonths] = useState<number>(preFilledConfig?.term || 60);
  const [creditTier, setCreditTier] = useState<number>(preFilledConfig?.creditScore || 750);
  
  // Custom acquisition mode state pre-filled from calculator
  const [acquisitionMode, setAcquisitionMode] = useState<'FINANCING' | 'RENT_TO_OWN' | 'CASH'>(
    preFilledConfig?.acquisitionMode || 'FINANCING'
  );

  // Document states
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; type: string; size: number }[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Biometric states
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanComplete, setScanComplete] = useState<boolean>(false);

  // Double check calculated rate and monthly payments depending on selected acquisition strategy
  const activeTier = CREDIT_TIERS.find(t => creditTier >= t.minScore) || CREDIT_TIERS[CREDIT_TIERS.length - 1];
  const makeInfo = CAR_MAKES.find(m => m.name === carMake) || CAR_MAKES[0];
  
  // Custom rate and monthly calculator logic
  const interestRate = acquisitionMode === 'CASH' 
    ? 0 
    : acquisitionMode === 'RENT_TO_OWN'
      ? Math.max(2.99, Number((activeTier.baseRate + makeInfo.baseRateAdjustment + 3.0).toFixed(2)))
      : Math.max(2.99, Number((activeTier.baseRate + makeInfo.baseRateAdjustment).toFixed(2)));

  const loanAmount = acquisitionMode === 'CASH' ? 0 : Math.max(0, price - downPayment);
  
  // Helper to estimate payment on-the-fly depending on dynamic strategies
  const calculateOnTheFlyPayment = () => {
    if (acquisitionMode === 'CASH') return 0;
    if (acquisitionMode === 'RENT_TO_OWN') {
      return Math.max(0, ((price - downPayment) / termMonths) * 1.15);
    }
    // Standard Amortization Rate
    if (loanAmount <= 0) return 0;
    const r = interestRate / 12 / 100;
    const n = termMonths;
    if (r === 0) return loanAmount / n;
    return (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  };
  const estimatedMonthly = calculateOnTheFlyPayment();

  // Handle fake scanning for biometrics
  const startBiometricEnrollment = () => {
    setIsScanning(true);
    setScanComplete(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      setBiometricEnabled(true);
    }, 2000);
  };

  // Drag and Drop files helpers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const addFiles = (fileList: FileList) => {
    const rawFiles = Array.from(fileList);
    const mapped = rawFiles.map(f => ({
      name: f.name,
      type: f.name.includes('ID') || f.name.includes('License') ? 'ID' : 'INCOME',
      size: f.size
    }));
    setUploadedFiles(prev => [...prev, ...mapped]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Submit full form to backend
  const handleFormSubmit = async () => {
    setErrorMessage('');
    if (!applicantName.trim()) {
      setErrorMessage("Please enter applicant name.");
      return;
    }
    if (!applicantEmail.trim() || !applicantEmail.includes('@')) {
      setErrorMessage("Please enter a valid applicant email address.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicantName,
          applicantEmail,
          carMake,
          carModel,
          carYear,
          loanAmount: acquisitionMode === 'CASH' ? price * 0.95 : loanAmount,
          downPayment,
          termMonths,
          interestRate,
          monthlyPayment: estimatedMonthly,
          creditScore: creditTier,
          biometricSecured: biometricEnabled,
          acquisitionMode
        })
      });

      if (!response.ok) {
        throw new Error("Unable to submit application to custom underwriters.");
      }

      const applicationData = await response.json();

      // Submit any files that were designated during the application!
      if (uploadedFiles.length > 0) {
        for (const fileItem of uploadedFiles) {
          await fetch(`/api/applications/${applicationData.id}/documents`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: fileItem.name,
              type: fileItem.type,
              size: fileItem.size
            })
          });
        }
      }

      // Launch Success trigger back
      onSubmitSuccess(applicationData.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Underwriter pipeline connection timeout. Retry again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Step Header Indicator */}
      <div className="mb-8 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 sm:p-6 text-white text-center flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight flex items-center justify-center md:justify-start gap-2">
            <span className="text-red-500 font-mono">STEP {step} / 4</span>
            <span className="text-neutral-400">|</span>
            <span>
              {step === 1 && "Personal Profile"}
              {step === 2 && "Vehicle Parameters"}
              {step === 3 && "Secure Document Vault"}
              {step === 4 && "Accreditation Security"}
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1 md:text-left">
            {step === 1 && "Declare income and verification parameters"}
            {step === 2 && "Adjust desired financing size & vehicle details"}
            {step === 3 && "Drag-and-drop secure verification papers"}
            {step === 4 && "Configure FaceID/TouchID secure locking layer"}
          </p>
        </div>
        
        {/* Progress indicators dots */}
        <div className="flex items-center gap-1.5 bg-neutral-950 p-2 border border-neutral-800 rounded-xl">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`w-8 h-2 rounded transition-all duration-350 ${
                step >= i 
                  ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' 
                  : 'bg-neutral-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Form Box */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative">
        {errorMessage && (
          <div className="mb-6 bg-red-950/40 border border-red-500/30 p-4 rounded-xl flex items-start gap-3 text-red-200 text-xs text-left">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider block mb-0.5">Application Error</span>
              {errorMessage}
            </div>
          </div>
        )}

        {/* STEP 1: PERSONAL PROFILE */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="border-b border-neutral-800 pb-4 mb-4">
              <h3 className="text-lg font-semibold font-display tracking-wide flex items-center gap-2">
                <User className="w-5 h-5 text-red-500" /> Borrower & Applicant Profile
              </h3>
              <p className="text-xs text-neutral-400">Underwriters utilize personal information to compute automated verification parameters.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Legal Representative Full Name</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Email Address (Automation Receiver)</label>
                <input
                  type="email"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
                  placeholder="name@email.com"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">Simulation updates & approval notifications will deliver here.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Declared Annual Income (Gross)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-neutral-500 text-sm">₱</span>
                  <input
                    type="number"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 pl-7 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Current Employer / Company Name</label>
                <input
                  type="text"
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
                  placeholder="e.g. Acme Corp"
                />
              </div>
            </div>

            <div className="bg-neutral-950 p-4 border border-neutral-800/80 rounded-xl flex items-start gap-3 mt-4">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                By clicking proceed, you authorize the evaluation of financial details to structure custom loan brackets. This action is protected by a fully simulated SSL connection inside the portal.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: VEHICLE CONFIGURATION */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="border-b border-neutral-800 pb-4 mb-4">
              <h3 className="text-lg font-semibold font-display tracking-wide">Vehicle Acquisition Specifications</h3>
              <p className="text-xs text-neutral-400 font-sans">Modify parameters to adjust estimated monthly interest and payment details live</p>
            </div>

            {/* Acquisition Switcher widget */}
            <div className="bg-neutral-950 p-4 border border-neutral-850 rounded-xl space-y-3">
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">Required Acquisition Option</label>
              <div className="grid grid-cols-3 gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => setAcquisitionMode('FINANCING')}
                  className={`py-2 px-1 text-xs font-bold uppercase rounded-lg transition-all ${
                    acquisitionMode === 'FINANCING'
                      ? 'bg-red-650 text-white shadow-md'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  🚘 Financing
                </button>
                <button
                  type="button"
                  onClick={() => setAcquisitionMode('RENT_TO_OWN')}
                  className={`py-2 px-1 text-xs font-bold uppercase rounded-lg transition-all ${
                    acquisitionMode === 'RENT_TO_OWN'
                      ? 'bg-red-650 text-white shadow-md'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  🔑 Rent-to-Own
                </button>
                <button
                  type="button"
                  onClick={() => setAcquisitionMode('CASH')}
                  className={`py-2 px-1 text-xs font-bold uppercase rounded-lg transition-all ${
                    acquisitionMode === 'CASH'
                      ? 'bg-red-650 text-white shadow-md'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  💰 Cash Buyout
                </button>
              </div>
              <p className="text-[10px] text-neutral-500 font-medium">
                {acquisitionMode === 'FINANCING' && "Traditional sponsor financing with competitive APR mapped to your credit profile."}
                {acquisitionMode === 'RENT_TO_OWN' && "Low entry requirements. Auto approval with no strict credit checks. Transfers to full ownership at maturity."}
                {acquisitionMode === 'CASH' && "Earn a customized 5.0% flat Cash discount on purchase. ₱0 monthly obligations."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Manufacturer Brand</label>
                <select
                  value={carMake}
                  onChange={(e) => setCarMake(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
                >
                  {CAR_MAKES.map(m => (
                    <option key={m.name} value={m.name}>{m.logo} {m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Model Name</label>
                <input
                  type="text"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Model Year</label>
                <select
                  value={carYear}
                  onChange={(e) => setCarYear(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 font-medium font-mono"
                >
                  {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <hr className="border-neutral-800/80 my-4" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Purchase Value (₱)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Allocated Down Payment</label>
                <input
                  type="number"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Math.min(price, Number(e.target.value)))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Subsequent Loan Term</label>
                <select
                  value={termMonths}
                  onChange={(e) => setTermMonths(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 font-mono font-medium"
                >
                  {[24, 30, 36, 48, 60, 72, 84].map(m => (
                    <option key={m} value={m}>{m} Months</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live terms recap banner depending on strategies */}
            <div className="bg-gradient-to-r from-red-950/20 to-neutral-950 border border-red-500/10 rounded-xl p-5 mt-4 grid grid-cols-3 gap-4">
              <div className="text-center md:text-left">
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-sans font-semibold mb-1">
                  {acquisitionMode === 'CASH' ? 'Cash Discount Rate' : 'Equivalent Rate'}
                </span>
                <span className="text-lg sm:text-2xl font-bold font-mono text-red-500">
                  {acquisitionMode === 'CASH' ? '5.0%' : `${interestRate}%`}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-sans font-semibold mb-1">
                  {acquisitionMode === 'CASH' ? 'Total Buyout Due' : 'Financed Principal'}
                </span>
                <span className="text-lg sm:text-2xl font-bold font-mono text-white">
                  ₱{(acquisitionMode === 'CASH' ? price * 0.95 : loanAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="text-center md:text-right">
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-sans font-semibold mb-1">
                  {acquisitionMode === 'CASH' ? 'Periodic Installment' : 'Monthly Payment'}
                </span>
                <span className="text-lg sm:text-2xl font-bold font-mono text-red-400">
                  ₱{estimatedMonthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SECURE DOCUMENT UPLOAD */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="border-b border-neutral-800 pb-4 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold font-display tracking-wide flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-red-500" /> Secure Verification Vault
                </h3>
                <p className="text-xs text-neutral-400">Upload standard verification documents now to jump Directly to Under Review</p>
              </div>
              <span className="text-[10px] text-red-500 border border-red-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono bg-red-950/20 font-bold">Encrypted</span>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-red-500 bg-red-950/10' 
                  : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                multiple 
                accept="image/*,application/pdf"
              />
              <UploadCloud className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-sm font-semibold mb-1">Drag and drop verification files here, or click to browse</p>
              <p className="text-xs text-neutral-500">Supports PDF, PNG, or JPEG. Suggest: <span className="text-neutral-400 font-mono font-medium">government_id.pdf</span> or <span className="text-neutral-400 font-mono font-medium">recent_paystub.png</span></p>
            </div>

            {/* Uploaded File List */}
            {uploadedFiles.length > 0 ? (
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Selected files to submit ({uploadedFiles.length})</span>
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-neutral-950 border border-neutral-820 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-neutral-900 border border-red-500/20 text-red-400 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-medium font-mono text-white block max-w-[200px] truncate sm:max-w-xs">{file.name}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type} Type</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="text-xs text-neutral-400 hover:text-red-500 border border-neutral-800 hover:border-red-800 px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-neutral-950 p-4 border border-neutral-800/80 rounded-xl flex items-center gap-3 text-neutral-400 text-xs">
                <AlertCircle className="w-5 h-5 text-neutral-500 shrink-0" />
                <span>You can proceed without uploads now, but you will need to submit documentation on your dashboard to unlock custom underwriters screening.</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: BIOMETRIC AUTH SYSTEM */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="border-b border-neutral-800 pb-4 mb-4">
              <h3 className="text-lg font-semibold font-display tracking-wide flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-red-500" /> Biometric Identity Access Securement
              </h3>
              <p className="text-xs text-neutral-400">Activate biometric tokens (FaceID/TouchID) to instantly log in or lock loan configuration</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Simulator interactive area */}
              <div className="md:col-span-5 bg-neutral-950 border border-neutral-800 rounded-2xl p-6 text-center flex flex-col items-center justify-center min-h-[220px]">
                <Fingerprint className={`w-16 h-16 mb-4 transition-all ${
                  isScanning 
                    ? 'text-red-500 animate-pulse scale-110' 
                    : scanComplete 
                      ? 'text-green-500 scale-105' 
                      : 'text-neutral-500 hover:text-red-400'
                }`} />
                
                {isScanning ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-red-400 flex items-center justify-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Enrolling Biometrics...
                    </p>
                    <p className="text-[10px] text-neutral-500">Stand by, verifying client key parameters</p>
                  </div>
                ) : scanComplete ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-green-500 flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Key Secured Successfully!
                    </p>
                    <p className="text-[10px] text-neutral-400">Biometric fingerprint linked to application</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-neutral-300">Biometric Terminal</p>
                    <button
                      onClick={startBiometricEnrollment}
                      className="bg-neutral-900 hover:bg-neutral-800 text-xs border border-neutral-800 text-neutral-300 py-1.5 px-3 rounded-lg flex items-center gap-1 mx-auto"
                    >
                      Initialize Scan Test
                    </button>
                  </div>
                )}
              </div>

              {/* Informational area */}
              <div className="md:col-span-7 text-left space-y-4">
                <div className="flex gap-3">
                  <input
                    type="checkbox"
                    id="bio-check"
                    checked={biometricEnabled}
                    onChange={(e) => setBiometricEnabled(e.target.checked)}
                    className="w-4 h-4 rounded accent-red-500 cursor-pointer mt-0.5"
                  />
                  <label htmlFor="bio-check" className="text-xs font-semibold text-white cursor-pointer block select-none">
                    Require biometric authorization on login or underwriting contract releases.
                  </label>
                </div>
                
                <p className="text-xs text-neutral-400 leading-relaxed bg-neutral-950 p-3 border border-neutral-800 rounded-lg">
                  Applying WebAuthn simulation parameters translates physical hardware fingerprint tokens directly into client credentials. Your original biometric files never navigate outside this custom portal environment.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Footer Controls */}
        <div className="mt-8 pt-6 border-t border-neutral-850 flex justify-between gap-4 font-display">
          {step > 1 ? (
            <button
              onClick={() => setStep(prev => prev - 1)}
              disabled={submitting}
              className="px-4 py-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-300 text-xs font-medium tracking-wider flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div /> // Placeholder
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(prev => prev + 1)}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 ml-auto"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFormSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-2 ml-auto shadow-lg shadow-red-950/40 relative overflow-hidden disabled:bg-neutral-700 disabled:from-neutral-700"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Underwriting Submission...
                </>
              ) : (
                <>
                  Submit Financing Application <CheckCircle className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
