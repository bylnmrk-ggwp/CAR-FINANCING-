import React, { useState, useEffect, useCallback } from 'react';
import { LoanApplication, User, Tenant } from './types';
import RateCalculator from './components/RateCalculator';
import LoanForm from './components/LoanForm';
import Dashboard from './components/Dashboard';
import AICounselor from './components/AICounselor';
import EmailInbox from './components/EmailInbox';
import { useTheme } from './ThemeProvider';
import { 
  Flame, Gauge, PlusCircle, LayoutDashboard, BrainCircuit, 
  Mail, Menu, X, Landmark, ShieldCheck, HeartHandshake, PhoneCall, Sun, Moon, LogOut
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

  // Auth state
  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem('auth-token') || 'admin-token');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [loginEmail, setLoginEmail] = useState('');

  const { isDark, toggle: toggleTheme } = useTheme();

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'x-auth-token': authToken,
  }), [authToken]);

  // Verify token on mount and token change
  useEffect(() => {
    localStorage.setItem('auth-token', authToken);

    const verify = async () => {
      try {
        const res = await fetch('/api/auth/me', { headers: { 'x-auth-token': authToken } });
        if (res.ok) {
          const body = await res.json();
          setCurrentUser(body.user);
          setCurrentTenant(body.tenant);
        } else {
          setCurrentUser(null);
          setCurrentTenant(null);
        }
      } catch {
        setCurrentUser(null);
        setCurrentTenant(null);
      }
    };
    verify();
  }, [authToken]);

  const handleLogin = async () => {
    if (!loginEmail.trim()) return;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim() }),
      });
      if (res.ok) {
        const body = await res.json();
        setAuthToken(body.user.token);
        setCurrentUser(body.user);
        setCurrentTenant(body.tenant);
        setLoginEmail('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    setAuthToken('');
    setCurrentUser(null);
    setCurrentTenant(null);
    localStorage.removeItem('auth-token');
  };

  // Fetch applications list on mount
  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications?limit=100', { headers: { 'x-auth-token': authToken } });
      if (res.ok) {
        const body = await res.json();
        setApplications(body.data);
        
        // Auto-select the first application if none chosen
        if (body.data.length > 0 && !selectedAppId) {
          setSelectedAppId(body.data[0].id);
        }
      }
    } catch (err) {
      console.error("Unable to connect with full-stack ledger server:", err);
    }
  };

  // Poll for simulated email count
  const checkEmailCount = async () => {
    try {
      const res = await fetch('/api/emails?limit=1', { headers: { 'x-auth-token': authToken } });
      if (res.ok) {
        const body = await res.json();
        setEmailCount(body.pagination.total);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchApplications();
    checkEmailCount();
    const interval = setInterval(checkEmailCount, 4000);
    return () => clearInterval(interval);
  }, [currentUser, authToken]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-sm w-full text-center space-y-6">
          <div className="flex justify-center">
            <img src="/assets/.aistudio/image/white.png" alt="MCARS" className="h-12 w-auto" />
          </div>
          <h1 className="text-xl font-bold uppercase tracking-wider">Sign In</h1>
          <p className="text-xs text-neutral-400">Enter your email to access the financing portal.</p>
          <input
            type="email"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="e.g. admin@mcars.com"
            className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm py-3 rounded-xl transition"
          >
            Sign In
          </button>
          <p className="text-[10px] text-neutral-500">Demo users: admin@mcars.com / sarah.j@example.com / m.bennett@example.com</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 light:bg-neutral-50 light:text-neutral-900 flex flex-col font-sans transition-all selection:bg-red-600 selection:text-white">
      
      {/* Sleek executive red-and-black header banner */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 light:bg-white/80 backdrop-blur-md border-b border-neutral-900/60 light:border-neutral-200 transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex justify-between items-center">
          
          {/* Logo brand label */}
          <div className="flex items-center gap-3">
            <img
              src={isDark ? "/assets/.aistudio/image/white.png" : "/assets/.aistudio/image/nav.png"}
              alt="MCARS FINANCE"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </div>

          {/* Desktop Navigation Link buttons - touch targets of at least 44px achieved via py-2 sm:py-3 px-3 */}
          <nav className="hidden md:flex items-center gap-1 bg-neutral-900/50 light:bg-neutral-100 border border-neutral-870 light:border-neutral-200 p-1.5 rounded-xl font-display">
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
                      ? 'bg-red-600 text-white border border-red-500/20 shadow-md shadow-red-950/20 light:bg-red-500 light:text-neutral-900 light:border-red-300' 
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-white light:text-neutral-600 light:hover:bg-neutral-200 light:hover:text-neutral-900'
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

            {/* Dark/Light mode toggle */}
            <button
              onClick={toggleTheme}
              className="min-h-[44px] min-w-[44px] p-2.5 bg-neutral-900 hover:bg-neutral-850 light:bg-neutral-100 light:hover:bg-neutral-200 border border-neutral-800 light:border-neutral-300 text-neutral-300 light:text-neutral-600 hover:text-yellow-400 light:hover:text-yellow-500 rounded-xl transition flex items-center justify-center"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* User badge */}
            <div className="hidden sm:flex items-center gap-2 bg-neutral-900 light:bg-neutral-100 border border-neutral-800 light:border-neutral-300 rounded-xl px-3 py-1.5 text-[10px] font-mono">
              <span className="text-red-500 font-bold uppercase text-[9px]">{currentUser.role}</span>
              <span className="text-neutral-400 light:text-neutral-500">|</span>
              <span className="text-neutral-300 light:text-neutral-700 max-w-[100px] truncate">{currentUser.name}</span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="min-h-[44px] min-w-[44px] p-2.5 bg-neutral-900 hover:bg-neutral-850 light:bg-neutral-100 light:hover:bg-neutral-200 border border-neutral-800 light:border-neutral-300 text-neutral-400 light:text-neutral-600 hover:text-red-500 light:hover:text-red-600 rounded-xl transition flex items-center justify-center"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Automated email transactions button */}
            <button
              onClick={() => {
                setEmailInboxOpen(!emailInboxOpen);
                checkEmailCount();
              }}
              className="min-h-[44px] min-w-[44px] p-2.5 relative bg-neutral-900 hover:bg-neutral-850 light:bg-neutral-100 light:hover:bg-neutral-200 border border-neutral-800 light:border-neutral-300 text-neutral-300 light:text-neutral-600 hover:text-red-500 light:hover:text-red-600 rounded-xl transition flex items-center justify-center gap-2"
              title="Automated Notification logs"
            >
              <Mail className="w-4.5 h-4.5" />
              {emailCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white font-mono text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-neutral-950 light:border-red-800 shadow">
                  {emailCount}
                </span>
              )}
              <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider pr-1">Logs</span>
            </button>

            {/* Mobile burger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden min-h-[44px] min-w-[44px] p-2 bg-neutral-900 light:bg-neutral-100 border border-neutral-800 light:border-neutral-300 rounded-xl text-neutral-300 light:text-neutral-600 flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-950 light:bg-white border-b border-neutral-900 light:border-neutral-200 py-4 font-display">
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
                      ? 'bg-red-950/40 text-white border border-red-500/20 light:bg-red-100 light:text-neutral-900' 
                      : 'text-neutral-400 hover:bg-neutral-900 light:text-neutral-600 light:hover:bg-neutral-200'
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
      <main className="grow pb-16 bg-gradient-to-b from-[#030303] via-[#090909] to-[#040404] light:from-neutral-50 light:via-neutral-50 light:to-neutral-50">
        
        {/* Pitch Hero layout just for calculate tab to give luxury executive vibe */}
        {activeTab === 'CALCULATE' && (
          <section className="relative overflow-hidden pt-12 sm:pt-16 pb-6 text-center text-white light:text-neutral-900 px-4">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-red-600/5 blur-3xl rounded-full select-none pointer-events-none" />
            <div className="max-w-4xl mx-auto space-y-4 relative z-10">
              <span className="text-[10px] tracking-widest font-bold text-red-500 uppercase bg-red-950/40 px-3 py-1 rounded-full border border-red-500/15">
                Daily Benchmarks Reset Checked
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-red-400 light:from-neutral-900 light:via-neutral-700 light:to-red-600">
                REVOLUTIONIZING CAR FINANCING
              </h2>
              <p className="max-w-2xl mx-auto text-xs sm:text-sm text-neutral-400 light:text-neutral-500 leading-relaxed font-normal">
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
              authToken={authToken}
            />
          )}

          {activeTab === 'AI_ADVISOR' && (
            <AICounselor activeApplicationContext={selectedAppObj} />
          )}
        </div>

      </main>

      {/* Executive Premium Footer */}
      <footer className="bg-neutral-950 light:bg-white border-t border-neutral-900/80 light:border-neutral-200 py-10 text-neutral-500 light:text-neutral-400 text-xs text-center font-display">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-red-500" />
              <span className="text-white light:text-neutral-900 font-bold tracking-tight uppercase">MCARS FINANCE</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-[10px] uppercase font-semibold tracking-wider text-neutral-400">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-red-500" /> WebAuthn Encryption</span>
              <span className="flex items-center gap-1"><HeartHandshake className="w-3.5 h-3.5 text-red-500" /> Fair Lending Standard</span>
              <span className="flex items-center gap-1"><PhoneCall className="w-3.5 h-3.5 text-red-500" /> 1-800-MCARS</span>
            </div>
          </div>

          <hr className="border-neutral-900 light:border-neutral-200" />

          <p className="text-[10px] text-neutral-500 leading-relaxed font-sans max-w-3xl mx-auto">
            © 2026 MCARS Finance Inc. Licenses are issued by custom underwriter divisions. Pre-qualification quotes are promotional values and do not represent a final authorization binding contract. All activities log details are securely monitored by our backend server simulator.
          </p>
        </div>
      </footer>

      {/* Automated Email Inbox console trigger */}
      {emailInboxOpen && (
        <EmailInbox onClose={() => setEmailInboxOpen(false)} authToken={authToken} />
      )}

    </div>
  );
}
