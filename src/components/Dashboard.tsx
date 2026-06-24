import React, { useState, useRef } from 'react';
import { LoanApplication } from '../types';
import { 
  CheckCircle, Clock, Search, AlertCircle, UploadCloud, 
  ChevronRight, Sparkles, TrendingUp, RefreshCcw, Mail, ArrowRight, ShieldAlert, FileText 
} from 'lucide-react';

interface DashboardProps {
  applications: LoanApplication[];
  selectedAppId: string | null;
  onSelectApp: (id: string) => void;
  onRefresh: () => void;
  onEmailInboxToggle: () => void;
  authToken: string;
}

export default function Dashboard({ 
  applications, 
  selectedAppId, 
  onSelectApp, 
  onRefresh, 
  onEmailInboxToggle,
  authToken
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authHeaders = { 'Content-Type': 'application/json', 'x-auth-token': authToken };

  // Filter application list based on search term
  const filteredApps = applications.filter(app => 
    app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.carMake.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Active tracked application
  const activeApp = applications.find(app => app.id === selectedAppId) || applications[0];

  // Fast-track transition
  const handleAdvanceStatus = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAdvancingId(id);
    try {
      const res = await fetch(`/api/applications/${id}/advance`, {
        method: 'POST',
        headers: authHeaders
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdvancingId(null);
    }
  };

  // Handle document submission from the dashboard box
  const handleDashboardFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeApp && e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadingId(activeApp.id);
      try {
        const res = await fetch(`/api/applications/${activeApp.id}/documents`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            name: file.name,
            type: file.name.includes('ID') || file.name.includes('License') ? 'ID' : 'INCOME',
            size: file.size
          })
        });
        if (res.ok) {
          onRefresh();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setUploadingId(null);
      }
    }
  };

  // Determine matching visual steps
  const getStatusIndices = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 1;
      case 'DOCUMENTS_PENDING': return 2;
      case 'UNDER_REVIEW': return 3;
      case 'APPROVED': return 4;
      case 'REJECTED': return 4;
      default: return 1;
    }
  };

  const activeIndex = activeApp ? getStatusIndices(activeApp.status) : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white light:text-neutral-900">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Real-time Application Sidebar selector */}
        <div className="lg:col-span-4 bg-neutral-900 light:bg-white border border-neutral-800 light:border-neutral-200 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold font-display tracking-wide uppercase">All Applications</h3>
              <p className="text-xs text-neutral-400 light:text-neutral-600">Select pre-approvals to inspect</p>
            </div>
            
            <button 
              onClick={onRefresh}
              className="p-1.5 hover:bg-neutral-850 light:hover:bg-neutral-200 rounded-lg text-neutral-400 light:text-neutral-600 hover:text-red-500 light:hover:text-red-600 border border-neutral-800 light:border-neutral-200 transition"
              title="Refresh ledger"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by ID or Client Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-950 light:bg-neutral-50 border border-neutral-800 light:border-neutral-300 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* List items */}
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {filteredApps.length > 0 ? (
              filteredApps.map((app) => {
                const isActive = activeApp?.id === app.id;
                return (
                  <div
                    key={app.id}
                    onClick={() => onSelectApp(app.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isActive 
                        ? 'border-red-500 bg-red-950/25 shadow-md shadow-red-950/10' 
                        : 'border-neutral-800/80 bg-neutral-950/40 hover:border-neutral-700 hover:bg-neutral-950/75 light:border-neutral-200 light:bg-neutral-100 light:hover:border-neutral-300 light:hover:bg-neutral-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-semibold text-red-400">{app.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                        app.status === 'APPROVED' 
                          ? 'bg-green-950/50 text-green-400 border border-green-500/10 light:bg-green-100 light:text-green-700 light:border-green-300' 
                          : app.status === 'REJECTED' 
                            ? 'bg-red-950/50 text-red-400 border border-red-500/10 light:bg-red-100 light:text-red-700 light:border-red-300'
                            : app.status === 'UNDER_REVIEW'
                              ? 'bg-amber-950/50 text-amber-400 border border-amber-500/10 light:bg-amber-100 light:text-amber-700 light:border-amber-300'
                              : 'bg-neutral-800 text-neutral-400 border border-neutral-700/40 light:bg-neutral-200 light:text-neutral-600 light:border-neutral-300'
                    }`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="text-left mt-2.5">
                      <h4 className="text-sm font-semibold truncate text-white light:text-neutral-900">{app.applicantName}</h4>
                      <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-1">
                        <span className="light:text-neutral-600">{app.carYear} {app.carMake} {app.carModel}</span>
                        <span className="font-semibold text-neutral-300 light:text-neutral-700 font-mono">₱{app.loanAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Demonstration status cycle trigger */}
                    <div className="mt-3.5 pt-2 border-t border-neutral-800/50 flex justify-between items-center gap-2">
                      <span className="text-[9px] text-neutral-500 light:text-neutral-600 font-mono">Last Update: {new Date(app.statusUpdatedAt).toLocaleTimeString()}</span>
                      <button
                        onClick={(e) => handleAdvanceStatus(app.id, e)}
                        disabled={advancingId === app.id}
                        className="text-[9px] font-bold text-red-400 bg-red-950/30 hover:bg-red-950/65 light:bg-red-100 light:hover:bg-red-200 light:text-red-700 px-2 py-1 rounded border border-red-500/15 light:border-red-300 flex items-center gap-1 transition"
                      >
                        {advancingId === app.id ? 'Advancing...' : 'Simulate Update'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-neutral-500 light:text-neutral-600 text-center py-6">No application entries match constraints.</p>
            )}
          </div>

          <div className="bg-neutral-950 light:bg-neutral-100 border border-neutral-850 light:border-neutral-200 p-4 rounded-xl text-left space-y-2.5">
            <div className="flex items-center gap-2 text-red-500">
              <Mail className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">Automated System Logs</span>
            </div>
            <p className="text-[10px] text-neutral-400 leading-relaxed">
              Every status advancement is simulated instantly on our background server. Real-time notifications have sent matches directly to the simulated console.
            </p>
            <button
              onClick={onEmailInboxToggle}
              className="text-[10px] py-1.5 px-3 w-full bg-neutral-900 hover:bg-neutral-850 light:bg-neutral-200 light:hover:bg-neutral-300 rounded border border-neutral-800 light:border-neutral-300 text-neutral-300 light:text-neutral-700 font-semibold flex items-center justify-center gap-1.5 transition"
            >
              Inspect Simulated Email Logs <ArrowRight className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        </div>

        {/* Right Side: Track Status and Applications specs */}
        {activeApp ? (
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Real-time tracking pipeline maps */}
            <div className="bg-neutral-900 light:bg-white border border-neutral-800 light:border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xl text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-neutral-500 select-none">
                {activeApp.id}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-2">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-red-500 bg-red-950/30 px-2 py-0.5 rounded border border-red-500/10 mb-1.5 inline-block">Real-Time Core Stream</span>
                  <h2 className="text-xl sm:text-2xl font-bold font-display text-white light:text-neutral-900">{activeApp.applicantName}’s Financing tracking</h2>
                  <p className="text-xs text-neutral-400 light:text-neutral-600 mt-1">Car Loan Portfolio: <span className="text-neutral-200 light:text-neutral-800">{activeApp.carYear} {activeApp.carMake} {activeApp.carModel}</span></p>
                </div>
                
                {/* Simulated notifications widget */}
                <div className="bg-neutral-950 light:bg-neutral-100 border border-neutral-800 light:border-neutral-200 px-4 py-2.5 rounded-xl text-right">
                  <span className="text-[9px] text-neutral-500 light:text-neutral-600 block font-semibold uppercase">Monthly Obligation</span>
                  <span className="text-base sm:text-lg font-bold font-mono text-red-400">₱{activeApp.monthlyPayment.toFixed(2)}/mo</span>
                </div>
              </div>

              {/* Status Visual Tracker pipeline */}
              <div className="my-8 relative">
                {/* Horizontal progress bar behind nodes */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-neutral-800 light:bg-neutral-200 -translate-y-1/2 rounded-full hidden md:block" />
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-red-500 -translate-y-1/2 rounded-full hidden md:block transition-all duration-500" 
                  style={{ width: `${((activeIndex - 1) / 3) * 100}%` }}
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4 relative z-10 text-center md:text-left">
                  {[
                    { label: 'Submitted', desc: 'Pre-Qual Application received', num: 1 },
                    { label: 'Files Vault', desc: 'Government documents verification', num: 2 },
                    { label: 'Under Review', desc: 'Expert analyst rating evaluation', num: 3 },
                    { label: 'Final Decision', desc: 'Pre-Approved or declined result', num: 4 }
                  ].map((step, idx) => {
                    const isCompleted = activeIndex > step.num;
                    const isActive = activeIndex === step.num;
                    const isDecisionState = step.num === 4;

                    // Compute decision text based on actual approval
                    let nodeLabel = step.label;
                    if (isDecisionState) {
                      if (activeApp.status === 'APPROVED') {
                        nodeLabel = 'Contract Authorized';
                      } else if (activeApp.status === 'REJECTED') {
                        nodeLabel = 'Declined';
                      } else {
                        nodeLabel = 'Authorized Release';
                      }
                    }

                    return (
                      <div key={idx} className="flex md:flex-col items-center md:items-start gap-4 md:gap-2 text-left bg-neutral-950 light:bg-neutral-100 md:bg-transparent p-3 md:p-0 border border-neutral-800 light:border-neutral-200 md:border-transparent rounded-xl">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-all ${
                          isCompleted 
                            ? 'bg-green-600 border-2 border-green-400 text-white shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                            : isActive 
                              ? activeApp.status === 'REJECTED'
                                ? 'bg-red-600 border-2 border-red-400 text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                                : 'bg-red-500 border-2 border-red-300 text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                              : 'bg-neutral-900 border-2 border-neutral-800 text-neutral-500'
                        }`}>
                          {isCompleted ? '✓' : step.num}
                        </div>

                        <div>
                          <h4 className={`text-xs sm:text-sm font-semibold font-display ${isActive ? 'text-red-400 light:text-red-600' : isCompleted ? 'text-green-400 light:text-green-600' : 'text-neutral-400 light:text-neutral-600'}`}>
                            {nodeLabel}
                          </h4>
                          <p className="text-[10px] text-neutral-500 leading-normal mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Application Details Box */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 bg-neutral-950 light:bg-neutral-100 p-4 border border-neutral-850 light:border-neutral-200 rounded-xl font-mono text-xs">
                <div>
                  <span className="text-[9px] text-neutral-500 font-sans block uppercase font-bold mb-0.5">Strategy</span>
                  <span className="font-bold text-red-500 text-[10px] uppercase">
                    {(activeApp.acquisitionMode || 'FINANCING').replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 font-sans block uppercase font-bold mb-0.5">Offered APR</span>
                  <span className="font-semibold text-white light:text-neutral-900">
                    {activeApp.acquisitionMode === 'CASH' ? '0.00% (Discount)' : `${activeApp.interestRate}% APR`}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 font-sans block uppercase font-bold mb-0.5">Financing term</span>
                  <span className="font-semibold text-white light:text-neutral-900">
                    {activeApp.acquisitionMode === 'CASH' ? 'N/A' : `${activeApp.termMonths} Months`}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 font-sans block uppercase font-bold mb-0.5">Credit score</span>
                  <span className="font-semibold text-white light:text-neutral-900">{activeApp.creditScore} Tier</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 font-sans block uppercase font-bold mb-0.5">
                    {activeApp.acquisitionMode === 'CASH' ? 'Buyout Value' : 'Principal Amount'}
                  </span>
                  <span className="font-semibold text-red-400">
                    ₱{activeApp.loanAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-Panel: Documents missing helper & supplementary security */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              
              {/* Document upload / check list */}
              <div className="bg-neutral-900 light:bg-white border border-neutral-800 light:border-neutral-200 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800 light:border-neutral-200">
                  <h3 className="text-sm font-bold font-display uppercase tracking-wide">Verification Dossier</h3>
                  <span className="font-mono text-[10px] text-neutral-400">{activeApp.documents.length} Submitted</span>
                </div>

                {activeApp.status === 'DOCUMENTS_PENDING' && (
                  <div className="p-3 bg-red-950/20 light:bg-red-100 border border-red-500/20 light:border-red-300 rounded-xl text-[11px] text-red-200 light:text-red-800 leading-relaxed flex gap-2.5">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase tracking-wider block mb-0.5">Actions Required</span>
                      Underwriters are waiting for your identity proof. Upload standard ID file now to trigger automatic underwriter transitions.
                    </div>
                  </div>
                )}

                {/* Simulated file selector box */}
                <div className="space-y-2 mt-2">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-neutral-800 light:border-neutral-300 hover:border-red-500/50 light:hover:border-red-400 bg-neutral-950/50 light:bg-neutral-100 p-4 rounded-xl text-center cursor-pointer transition-all"
                  >
                    <input 
                      type="file" 
                      onChange={handleDashboardFileSelect} 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*,application/pdf"
                    />
                    <UploadCloud className="w-6 h-6 text-red-500 mx-auto mb-1.5" />
                    <span className="text-xs font-semibold block text-neutral-200 light:text-neutral-800">
                      {uploadingId === activeApp.id ? 'Uploading document...' : 'Attach Supplemental verification document'}
                    </span>
                    <span className="text-[10px] text-neutral-500">Fast-tracks screening transition immediately</span>
                  </div>

                  {activeApp.documents.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] font-bold text-neutral-500 light:text-neutral-600 uppercase block">Uploaded verification items</span>
                      {activeApp.documents.map((doc, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-neutral-950 light:bg-neutral-100 p-2.5 rounded-lg border border-neutral-850 light:border-neutral-200 text-xs">
                          <span className="font-mono font-medium max-w-[170px] truncate light:text-neutral-800">{doc.name}</span>
                          <span className="text-[9px] bg-red-950/20 text-red-400 border border-red-500/10 px-1.5 py-0.5 rounded font-mono font-bold uppercase light:bg-red-100 light:text-red-700 light:border-red-300">{doc.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Audit Logs ledger */}
            <div className="bg-neutral-900 light:bg-white border border-neutral-800 light:border-neutral-200 rounded-2xl p-6 shadow-xl text-left">
              <h3 className="text-sm font-bold font-display uppercase tracking-wide mb-4 pb-2 border-b border-neutral-800 light:border-neutral-200">Application Underwriting Event Ledger</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {activeApp.history.map((hist, idx) => (
                  <div key={idx} className="flex gap-4 items-start relative pb-3 border-l-2 border-neutral-800 light:border-neutral-200 pl-4 ml-2 last:border-transparent last:pb-0">
                    {/* Ring dot indicator */}
                    <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-red-500 ring-4 ring-neutral-900 light:ring-white" />
                    
                    <div className="grow">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-[10px] font-bold text-red-400 font-mono">{hist.status}</span>
                        <span className="text-[9px] text-neutral-500 font-mono">{new Date(hist.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-xs font-medium text-neutral-300 light:text-neutral-700 mt-1 leading-relaxed">
                        {hist.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-8 bg-neutral-900 light:bg-white border border-neutral-800 light:border-neutral-200 rounded-2xl p-12 text-center text-neutral-500 light:text-neutral-600">
            <AlertCircle className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
            <h3 className="text-lg font-bold font-display text-white light:text-neutral-900">No active applications found</h3>
            <p className="text-sm text-neutral-400 light:text-neutral-500 mt-1">Please configure your loan quote and click Pre-qualify to file a package.</p>
          </div>
        )}

      </div>
    </div>
  );
}
