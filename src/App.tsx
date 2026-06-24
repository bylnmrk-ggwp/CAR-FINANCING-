import React, { useState, useEffect } from 'react';
import { LoanApplication } from './types';
import RateCalculator from './components/RateCalculator';
import LoanForm from './components/LoanForm';
import Dashboard from './components/Dashboard';
import AICounselor from './components/AICounselor';
import EmailInbox from './components/EmailInbox';
import { 
  Flame, Gauge, PlusCircle, LayoutDashboard, BrainCircuit, 
  Mail, Menu, X, Landmark, ShieldCheck, HeartHandshake, PhoneCall
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'CALCULATE' | 'APPLY' | 'DASHBOARD' | 'AI_ADVISOR'>('CALCULATE');
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [preFilledConfig, setPreFilledConfig] = useState<any>(null);
  
  // Simulated email inbox visibility
  const [emailInboxOpen, setEmailInboxOpen] = useState<boolean>(false);
  const [emailCount, setEmailCount] = useState<number>(0);

  // Mobile navigation visibility
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Fetch applications list on mount
  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
        
        // Auto-select the first application if none chosen
        if (data.length > 0 && !selectedAppId) {
          setSelectedAppId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Unable to connect with full-stack ledger server:", err);
    }
  };

  // Poll for simulated email count
  const checkEmailCount = async () => {
    try {
      const res = await fetch('/api/emails');
      if (res.ok) {
        const data = await res.json();
        setEmailCount(data.length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchApplications();
    checkEmailCount();
    
    // Periodically sync email log badges
    const interval = setInterval(checkEmailCount, 4000);
    return () => clearInterval(interval);
  }, []);

  // Action: Pre-qualify from rate comparison
  const handlePreQualify = (config: any) => {
    setPreFilledConfig(config);
    setActiveTab('APPLY');
    // Scroll smoothly to topmost location
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Action: Successful loan submission
  const handleFormSubmitSuccess = (newId: string) => {
    setSelectedAppId(newId);
    fetchApplications();
    setPreFilledConfig(null);
    setActiveTab('DASHBOARD');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectActiveApplication = (id: string) => {
    setSelectedAppId(id);
  };

  const selectedAppObj = applications.find(a => a.id === selectedAppId) || applications[0] || null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans transition-all selection:bg-red-600 selection:text-white">
      
      {/* Sleek executive red-and-black header banner */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-900/60 transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex justify-between items-center">
          
          {/* Logo brand label */}
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-red-600 to-red-950 border border-red-500/20 text-white rounded-xl shadow-lg shadow-red-950/30 flex items-center justify-center">
              <Landmark className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            
            <div className="text-left font-display">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
                MCARS <span className="text-red-500 font-extrabold text-xs sm:text-sm bg-red-950/40 border border-red-500/20 px-2 py-0.5 rounded font-mono">FINANCE</span>
              </h1>
              <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mt-1">Underwriter Accreditation Portal</p>
            </div>
          </div>

          {/* Desktop Navigation Link buttons - touch targets of at least 44px achieved via py-2 sm:py-3 px-3 */}
          <nav className="hidden md:flex items-center gap-1 bg-neutral-900/50 border border-neutral-870 p-1.5 rounded-xl font-display">
            {[
              { id: 'CALCULATE', label: 'Rate Calculator', icon: <Gauge className="w-4 h-4" /> },
              { id: 'APPLY', label: 'Apply for Loan', icon: <PlusCircle className="w-4 h-4" /> },
              { id: 'DASHBOARD', label: 'Tracking Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
              { id: 'AI_ADVISOR', label: 'AI Loan Counselor', icon: <BrainCircuit className="w-4 h-4" /> }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`min-h-[44px] px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-red-650 text-white border border-red-500/20 shadow-md shadow-red-950/20' 
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Supplemental action items (Simulated email & mobile menu toggle) */}
          <div className="flex items-center gap-2">
            
            {/* Automated email transactions button */}
            <button
              onClick={() => {
                setEmailInboxOpen(!emailInboxOpen);
                checkEmailCount();
              }}
              className="min-h-[44px] min-w-[44px] p-2.5 relative bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-red-500 rounded-xl transition flex items-center justify-center gap-2"
              title="Automated Notification logs"
            >
              <Mail className="w-4.5 h-4.5" />
              {emailCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-650 text-white font-mono text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-neutral-950 shadow">
                  {emailCount}
                </span>
              )}
              <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider pr-1">Logs</span>
            </button>

            {/* Mobile burger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden min-h-[44px] min-w-[44px] p-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-300 flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-950 border-b border-neutral-900 py-4 font-display">
          <div className="px-4 space-y-2">
            {[
              { id: 'CALCULATE', label: 'Compare & Calculate Rates', icon: <Gauge className="w-4 h-4 text-red-500" /> },
              { id: 'APPLY', label: 'File Loan Application', icon: <PlusCircle className="w-4 h-4 text-red-500" /> },
              { id: 'DASHBOARD', label: 'Dash Real-time Tracker', icon: <LayoutDashboard className="w-4 h-4 text-red-500" /> },
              { id: 'AI_ADVISOR', label: 'AI Counselor (High Thinking)', icon: <BrainCircuit className="w-4 h-4 text-red-500" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full min-h-[44px] px-4 py-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-3 rounded-lg text-left ${
                  activeTab === tab.id 
                    ? 'bg-red-950/40 text-white border border-red-500/20' 
                    : 'text-neutral-400 hover:bg-neutral-900'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Core View Area */}
      <main className="grow pb-16 bg-gradient-to-b from-[#030303] via-[#090909] to-[#040404]">
        
        {/* Pitch Hero layout just for calculate tab to give luxury executive vibe */}
        {activeTab === 'CALCULATE' && (
          <section className="relative overflow-hidden pt-12 sm:pt-16 pb-6 text-center text-white px-4">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-red-650/5 blur-3xl rounded-full select-none pointer-events-none" />
            <div className="max-w-4xl mx-auto space-y-4 relative z-10">
              <span className="text-[10px] tracking-widest font-bold text-red-500 uppercase bg-red-950/40 px-3 py-1 rounded-full border border-red-500/15">
                Daily Benchmarks Reset Checked
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-red-400">
                REVOLUTIONIZING CAR FINANCING
              </h2>
              <p className="max-w-2xl mx-auto text-xs sm:text-sm text-neutral-400 leading-relaxed font-normal">
                Compare dynamic interest rates customized automatically by automaker makes and credit brackets. Fast-track with secure documents vaulting, biometric security and real-time underwriter tracking.
              </p>
            </div>
          </section>
        )}

        {/* Dynamic Nav Tabs Rendering */}
        <div id="render-tab-wrapper">
          {activeTab === 'CALCULATE' && (
            <RateCalculator onPreQualify={handlePreQualify} />
          )}

          {activeTab === 'APPLY' && (
            <LoanForm 
              preFilledConfig={preFilledConfig} 
              onSubmitSuccess={handleFormSubmitSuccess} 
            />
          )}

          {activeTab === 'DASHBOARD' && (
            <Dashboard 
              applications={applications} 
              selectedAppId={selectedAppId} 
              onSelectApp={selectActiveApplication}
              onRefresh={fetchApplications}
              onEmailInboxToggle={() => setEmailInboxOpen(true)}
            />
          )}

          {activeTab === 'AI_ADVISOR' && (
            <AICounselor activeApplicationContext={selectedAppObj} />
          )}
        </div>

      </main>

      {/* Executive Premium Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-900/80 py-10 text-neutral-500 text-xs text-center font-display">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-red-500" />
              <span className="text-white font-bold tracking-tight uppercase">MCARS FINANCE</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-[10px] uppercase font-semibold tracking-wider text-neutral-400">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-red-500" /> WebAuthn Encryption</span>
              <span className="flex items-center gap-1"><HeartHandshake className="w-3.5 h-3.5 text-red-500" /> Fair Lending Standard</span>
              <span className="flex items-center gap-1"><PhoneCall className="w-3.5 h-3.5 text-red-500" /> 1-800-MCARS</span>
            </div>
          </div>

          <hr className="border-neutral-900" />

          <p className="text-[10px] text-neutral-500 leading-relaxed font-sans max-w-3xl mx-auto">
            © 2026 MCARS Finance Inc. Licenses are issued by custom underwriter divisions. Pre-qualification quotes are promotional values and do not represent a final authorization binding contract. All activities log details are securely monitored by our backend server simulator.
          </p>
        </div>
      </footer>

      {/* Automated Email Inbox console trigger */}
      {emailInboxOpen && (
        <EmailInbox onClose={() => setEmailInboxOpen(false)} />
      )}

    </div>
  );
}
