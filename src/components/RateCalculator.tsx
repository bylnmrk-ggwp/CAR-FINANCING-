import React, { useState, useEffect } from 'react';
import { CAR_MAKES, CREDIT_TIERS, LOAN_TERMS } from '../data';
import { 
  Percent, DollarSign, Calendar, Flame, Gauge, ArrowRight, Sparkles, 
  Coins, Key, RefreshCw, Cpu, BrainCircuit, Check, ShieldAlert, AlertCircle 
} from 'lucide-react';
import EMICalculator from './EMICalculator';

interface RateCalculatorProps {
  onPreQualify: (config: {
    carMake: string;
    carModel: string;
    price: number;
    downPayment: number;
    term: number;
    rate: number;
    monthlyPayment: number;
    creditScore: number;
    acquisitionMode: 'FINANCING' | 'RENT_TO_OWN' | 'CASH';
  }) => void;
}

export default function RateCalculator({ onPreQualify }: RateCalculatorProps) {
  const [price, setPrice] = useState<number>(45000);
  const [downPayment, setDownPayment] = useState<number>(9000);
  const [term, setTerm] = useState<number>(60);
  const [creditTier, setCreditTier] = useState<number>(710); // Standard Good/Verygood default
  const [carMake, setCarMake] = useState<string>('Tesla');
  const [carModel, setCarModel] = useState<string>('Model Y');
  
  // New Acquisition Mode State
  const [acquisitionMode, setAcquisitionMode] = useState<'FINANCING' | 'RENT_TO_OWN' | 'CASH'>('FINANCING');

  // AI rates analysis state
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [aiThinking, setAiThinking] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');

  // Find active credit tier details
  const activeTier = CREDIT_TIERS.find(t => creditTier >= t.minScore) || CREDIT_TIERS[CREDIT_TIERS.length - 1];
  const makeInfo = CAR_MAKES.find(m => m.name === carMake) || CAR_MAKES[0];

  // Base interest rate calculation
  const calculatedRate = Math.max(2.99, Number((activeTier.baseRate + makeInfo.baseRateAdjustment).toFixed(2)));
  const loanAmount = Math.max(0, price - downPayment);
  
  // Calculate traditional monthly payment formula
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);

  useEffect(() => {
    if (loanAmount <= 0) {
      setMonthlyPayment(0);
      setTotalInterest(0);
      return;
    }
    const r = calculatedRate / 12 / 100;
    const n = term;
    if (r === 0) {
      setMonthlyPayment(loanAmount / n);
      setTotalInterest(0);
    } else {
      const pmt = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      setMonthlyPayment(pmt);
      setTotalInterest((pmt * n) - loanAmount);
    }
  }, [price, downPayment, term, calculatedRate, loanAmount]);

  // Rent To Own Calculations
  // RTO surcharge is traditionally standard rate + a premium markup (e.g. 3.00%)
  const rtoSurchargeRate = Number((calculatedRate + 3.0).toFixed(2));
  // Rent To Own usually amortizes standard cost with key convenience markup of 15%
  const rtoMonthlyRent = Math.max(0, ((price - downPayment) / term) * 1.15);
  const rtoTotalRentPaid = rtoMonthlyRent * term + downPayment;
  const rtoPremiumFinanced = Math.max(0, rtoTotalRentPaid - price);

  // Cash Unit Buyout Calculations
  const cashDiscountRate = 5.0; // 5% flat buyout incentive discount
  const cashBuyoutAmount = price * (1 - cashDiscountRate / 100);
  const cashSavingsAmount = price * (0.05) + totalInterest;

  // Handle preset model configurations for easy selection
  const handlePresetMakeChange = (make: string) => {
    setCarMake(make);
    if (make === 'Tesla') {
      setCarModel('Model Y');
      setPrice(44990);
      setDownPayment(8000);
    } else if (make === 'BMW') {
      setCarModel('i4 M50');
      setPrice(69700);
      setDownPayment(12000);
    } else if (make === 'Mercedes-Benz') {
      setCarModel('EQE Sedan');
      setPrice(74900);
      setDownPayment(15000);
    } else if (make === 'Porsche') {
      setCarModel('Taycan');
      setPrice(99400);
      setDownPayment(20000);
    } else if (make === 'Toyota') {
      setCarModel('RAV4 Hybrid');
      setPrice(32500);
      setDownPayment(5000);
    } else if (make === 'Ford') {
      setCarModel('Mustang Mach-E');
      setPrice(45900);
      setDownPayment(8000);
    } else {
      setCarModel('Premium Cruiser');
    }
    // Clear dynamic AI analysis on model change to prompt fresh analysis
    setAiAnalysis('');
    setAiThinking('');
  };

  // Trigger simulated/live generative comparison API
  const fetchAIRatesAnalysis = async () => {
    setAiLoading(true);
    setAiError('');
    setAiAnalysis('');
    
    try {
      const res = await fetch('/api/counselor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              sender: 'user',
              text: `Generate acquisition rates comparison model for ${carMake} ${carModel} pricing $${price}. Down payment allocated $${downPayment} for term ${term} months with a credit score of ${creditTier}. Inform me which of the options (Traditional Financing, Rent to Own, or Cash Buyout) is ideal for my bracket.`
            }
          ],
          systemContext: {
            carMake,
            carModel,
            price,
            downPayment,
            term,
            rate: calculatedRate,
            monthlyPayment,
            creditScore: creditTier
          }
        })
      });

      if (!res.ok) {
        throw new Error("Unable to trigger high-thinking underwriting analyzer.");
      }

      const data = await res.json();
      setAiAnalysis(data.text);
      if (data.thinking) {
        setAiThinking(data.thinking);
      }
    } catch (err: any) {
      setAiError(err.message || "An error occurred fetching the rate breakdown.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      <div id="calculator-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-white">
        
        {/* Simulation/Controls Panel */}
        <div className="lg:col-span-7 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 sm:p-8 backdrop-blur shadow-2xl relative overflow-hidden text-left flex flex-col justify-between">
          <div>
            {/* Subtle decorative background gradient */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/5 blur-3xl rounded-full" />
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 sm:p-3 bg-red-950/40 border border-red-500/20 text-red-500 rounded-xl">
                <Gauge className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold font-display tracking-tight">Configure Procurement Inputs</h2>
                <p className="text-xs sm:text-sm text-neutral-400">Calibrate sliders to compare Financing, Rent-to-Own, & Cash buyout rates</p>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="space-y-6">
              {/* Automaker Select */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Automaker Brand Preset & Model</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {CAR_MAKES.slice(0, 4).map((make) => (
                    <button
                      key={make.name}
                      onClick={() => handlePresetMakeChange(make.name)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                        carMake === make.name
                          ? 'border-red-500 bg-red-950/20 text-white animate-pulse'
                          : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      <span className="text-base sm:text-lg">{make.logo}</span>
                      <span>{make.name}</span>
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-neutral-400 mb-1 block font-medium">Vehicle Make</span>
                    <select
                      value={carMake}
                      onChange={(e) => handlePresetMakeChange(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
                    >
                      {CAR_MAKES.map((m) => (
                        <option key={m.name} value={m.name}>{m.logo} {m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 mb-1 block font-medium">Car Model Name</span>
                    <input
                      type="text"
                      value={carModel}
                      onChange={(e) => {
                        setCarModel(e.target.value);
                        setAiAnalysis('');
                      }}
                      placeholder="e.g. Model Y"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-neutral-800" />

              {/* Vehicle Price Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Purchase Price</label>
                  <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 font-mono text-sm font-semibold text-red-500">
                    <span className="text-xs font-bold mr-1 select-none">₱</span>
                    {price.toLocaleString()}
                  </div>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="150000"
                  step="1000"
                  value={price}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setPrice(val);
                    if (downPayment >= val) setDownPayment(Math.floor(val * 0.2));
                    setAiAnalysis('');
                  }}
                  className="w-full accent-red-500 h-1.5 bg-neutral-950 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1 font-semibold">
                  <span>₱10,000</span>
                  <span>₱80,000</span>
                  <span>₱150,000</span>
                </div>
              </div>

              {/* Down Payment Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Down Payment ({Math.round((downPayment / price) * 100)}%)</label>
                  <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 font-mono text-sm font-semibold text-red-400">
                    <span className="text-xs font-bold mr-1 select-none">₱</span>
                    {downPayment.toLocaleString()}
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.floor(price * 0.8)}
                  step="500"
                  value={downPayment}
                  onChange={(e) => {
                    setDownPayment(Number(e.target.value));
                    setAiAnalysis('');
                  }}
                  className="w-full accent-red-500 h-1.5 bg-neutral-950 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1 font-semibold">
                  <span>₱0</span>
                  <span>Max (80%): ₱{(Math.floor(price * 0.8)).toLocaleString()}</span>
                </div>
              </div>

              {/* Credit Score Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Estimated Credit Score</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-400 font-medium font-mono">{activeTier.label.split(' ')[0]}</span>
                    <span className="flex items-center bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 font-mono text-sm font-semibold text-red-500">
                      {creditTier}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="350"
                  max="850"
                  step="5"
                  value={creditTier}
                  onChange={(e) => {
                    setCreditTier(Number(e.target.value));
                    setAiAnalysis('');
                  }}
                  className="w-full accent-red-500 h-1.5 bg-neutral-950 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed bg-neutral-950/40 p-2 border border-neutral-800/60 rounded font-medium">
                  {activeTier.description}
                </p>
              </div>

              {/* Loan Terms selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Acquisition Period Term (Months)</label>
                <div className="grid grid-cols-6 gap-2">
                  {LOAN_TERMS.map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setTerm(m);
                        setAiAnalysis('');
                      }}
                      className={`py-2 rounded-lg border font-mono text-xs font-semibold text-center transition-all ${
                        term === m
                          ? 'border-red-500 bg-red-950/20 text-white shadow-md'
                          : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-850 bg-neutral-950/30 p-4 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-neutral-400 text-xs">
              <BrainCircuit className="w-4 h-4 text-red-500" />
              <span>Unsure which acquisition model fits? Compare instantly with AI</span>
            </div>
            <button
              onClick={fetchAIRatesAnalysis}
              disabled={aiLoading}
              className="py-1.5 px-3 bg-red-950/40 hover:bg-red-900 border border-red-500/30 text-red-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1"
            >
              {aiLoading ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-red-400" /> AI Compare Rates
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Acquisition Projections Dashboard */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Prime Summary Card with Mode Selector */}
          <div className="bg-gradient-to-br from-neutral-900 to-[#101010] border border-neutral-800 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            
            {/* Header: Mode Switcher tabs */}
            <div className="space-y-4">
              <span className="text-[10px] tracking-widest font-bold text-red-500 uppercase bg-red-950/30 border border-red-500/15 px-2.5 py-0.5 rounded-full">
                Interactive rate selector
              </span>

              {/* THREE-WAY TABS FOR RENT TO OWN vs CASH BUYOUT vs FINANCING */}
              <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-850 font-display">
                <button
                  onClick={() => setAcquisitionMode('FINANCING')}
                  className={`py-2 px-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition flex flex-col items-center justify-center gap-1 ${
                    acquisitionMode === 'FINANCING'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Finance</span>
                </button>
                <button
                  onClick={() => setAcquisitionMode('RENT_TO_OWN')}
                  className={`py-2 px-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition flex flex-col items-center justify-center gap-1 ${
                    acquisitionMode === 'RENT_TO_OWN'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Rent-To-Own</span>
                </button>
                <button
                  onClick={() => setAcquisitionMode('CASH')}
                  className={`py-2 px-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition flex flex-col items-center justify-center gap-1 ${
                    acquisitionMode === 'CASH'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Cash Unit</span>
                </button>
              </div>
            </div>

            {/* Main stats display based on acquisition mode */}
            <div className="my-6">
              
              {/* DISPLAY MODE 1: FINANCING */}
              {acquisitionMode === 'FINANCING' && (
                <div className="space-y-5 text-left">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Monthly Payment (Financing)</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-4xl sm:text-5xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-white via-red-200 to-red-400">
                        ₱{monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm font-medium text-neutral-400">/mo</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-y border-neutral-800/80 py-4 font-mono text-xs">
                    <div>
                      <span className="text-[9px] text-neutral-500 block uppercase font-sans font-semibold mb-0.5">Offered APR</span>
                      <span className="font-semibold text-red-400 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 inline text-red-500" /> {calculatedRate}% Rate
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 block uppercase font-sans font-semibold mb-0.5">Financed Principal</span>
                      <span className="font-semibold text-white">₱{loanAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 block uppercase font-sans font-semibold mb-0.5">Terms Duration</span>
                      <span className="font-semibold text-neutral-300">{term} Months</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 block uppercase font-sans font-semibold mb-0.5">Total Interest paid</span>
                      <span className="font-semibold text-neutral-300">₱{totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-neutral-400 leading-normal">
                      Borrower interest rates customized automatically based on <span className="text-white font-semibold font-mono">{creditTier} credit profile</span>.
                    </p>
                  </div>
                </div>
              )}

              {/* DISPLAY MODE 2: RENT TO OWN */}
              {acquisitionMode === 'RENT_TO_OWN' && (
                <div className="space-y-5 text-left font-sans">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Estimated Monthly Rental Fee (RTO)</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-4xl sm:text-5xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-white via-red-200 to-red-400">
                        ₱{rtoMonthlyRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm font-medium text-neutral-400">/mo</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-y border-neutral-800/80 py-4 font-mono text-xs">
                    <div>
                      <span className="text-[9px] text-neutral-500 block uppercase font-sans font-semibold mb-0.5">Surcharge Rate Equivalent</span>
                      <span className="font-semibold text-red-400 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 inline text-red-500" /> {rtoSurchargeRate}% APR
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 block uppercase font-sans font-semibold mb-0.5">Security deposit</span>
                      <span className="font-semibold text-white">₱{Math.round(downPayment * 0.6).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 block uppercase font-sans font-semibold mb-0.5">RTO Contract term</span>
                      <span className="font-semibold text-neutral-300">{term} Months</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 block uppercase font-sans font-semibold mb-0.5">Convenience Premium</span>
                      <span className="font-semibold text-neutral-300">₱{Math.round(rtoPremiumFinanced).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#1e1515] rounded-xl border border-red-950/50 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                    <p className="text-[10px] text-neutral-400 leading-normal">
                      <strong className="text-white block uppercase text-[8px] tracking-wider mb-0.5 text-red-400">No Hard Credit Checks Required</strong>
                      Approved automatically. Low security deposit requirement with direct ownership transfer at contract maturity.
                    </p>
                  </div>
                </div>
              )}

              {/* DISPLAY MODE 3: CASH UNIT BUYOUT */}
              {acquisitionMode === 'CASH' && (
                <div className="space-y-5 text-left">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Total Buyout Amount (One-Time)</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-4xl sm:text-5xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-white via-green-200 to-green-400">
                        ₱{cashBuyoutAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-xs font-semibold text-green-400 bg-green-950/50 px-2 py-0.5 rounded border border-green-500/10 ml-2">5% Buyout Save</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-y border-neutral-800/80 py-4 font-mono text-xs">
                    <div>
                      <span className="text-[9px] text-neutral-500 block uppercase font-sans font-semibold mb-0.5">Financing APR</span>
                      <span className="font-semibold text-neutral-500">0.00% (None)</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 block uppercase font-sans font-semibold mb-0.5">Immediate Price Discount</span>
                      <span className="font-semibold text-green-400">-₱{(price * 0.05).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 block uppercase font-sans font-semibold mb-0.5">Estimated Savings</span>
                      <span className="font-semibold text-green-400 font-bold">₱{Math.round(cashSavingsAmount).toLocaleString()} Total</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 block uppercase font-sans font-semibold mb-0.5">Vehicle Value Locked</span>
                      <span className="font-semibold text-white">₱{price.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-neutral-400 leading-normal font-sans">
                      Eliminates periodic interest bills completely. Earn premium <span className="text-white font-semibold">5% cash discount rate</span> at procurement checkout.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Act pre-qualify flow with custom configuration bundle */}
            <div className="mt-4">
              <button
                onClick={() => onPreQualify({
                  carMake,
                  carModel,
                  price,
                  downPayment,
                  term,
                  rate: acquisitionMode === 'CASH' ? 0 : acquisitionMode === 'RENT_TO_OWN' ? rtoSurchargeRate : calculatedRate,
                  monthlyPayment: acquisitionMode === 'CASH' ? 0 : acquisitionMode === 'RENT_TO_OWN' ? rtoMonthlyRent : monthlyPayment,
                  creditScore: creditTier,
                  acquisitionMode
                })}
                className="w-full bg-red-650 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs font-display hover:-translate-y-0.5"
              >
                Apply for {acquisitionMode === 'CASH' ? 'Cash Buyout' : acquisitionMode === 'RENT_TO_OWN' ? 'Rent to Own' : 'Finance Loan'} <ArrowRight className="w-4 h-4 text-red-200" />
              </button>
              
              <p className="text-[10px] text-neutral-500 text-center mt-3 leading-relaxed font-sans">
                *Simulated Rates. Complete document verification inside standard tracking dashboards to unlock official sponsor contracts.
              </p>
            </div>
          </div>

          {/* Sub-Panel: Standard Auto rates index */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg text-left">
            <h3 className="text-xs font-bold tracking-wider text-neutral-400 uppercase mb-3 font-display">Acquisition Category baseline Projections</h3>
            <div className="space-y-2.5 font-sans">
              <div className="flex justify-between items-center p-2 bg-neutral-950 rounded-lg border border-neutral-800">
                <div>
                  <span className="text-xs font-bold text-white block">Cash Unit Savings Rate</span>
                  <span className="text-[9px] text-neutral-500 font-mono">Bypasses periodic interest & setup fees</span>
                </div>
                <div className="text-right font-mono text-green-400 text-xs font-bold">
                  5.0% flat cut
                </div>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-neutral-950 rounded-lg border border-neutral-800">
                <div>
                  <span className="text-xs font-bold text-white block">Financing Base Interest Rate</span>
                  <span className="text-[9px] text-neutral-500 font-mono">Benchmark sponsor tier level rate</span>
                </div>
                <div className="text-right font-mono text-red-400 text-xs font-bold">
                  {calculatedRate.toFixed(2)}% APR
                </div>
              </div>

              <div className="flex justify-between items-center p-2 bg-neutral-950 rounded-lg border border-neutral-800">
                <div>
                  <span className="text-xs font-bold text-white block">Rent-to-Own Program Premium</span>
                  <span className="text-[9px] text-neutral-500 font-mono">Convenience insurance & high-flexibility buffer</span>
                </div>
                <div className="text-right font-mono text-amber-500 text-xs font-bold">
                  +{rtoSurchargeRate.toFixed(2)}% equivalent
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* AI ANALYSIS OUTPUT PANEL - Renders beautifully as a full bento card */}
      {(aiLoading || aiAnalysis || aiError) && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 text-left shadow-2xl relative overflow-hidden transition-all duration-350">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-650/5 blur-3xl rounded-full" />
          
          <div className="flex items-center justify-between border-b border-neutral-830 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-950/40 border border-red-500/20 text-red-500 rounded-xl">
                <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-display text-white">Underwriting AI Acquisition Suite</h3>
                <p className="text-[10px] text-neutral-400 font-mono">llama-3.3-70b-versatile : Groq Inference</p>
              </div>
            </div>

            <span className="text-[10px] text-red-500 border border-red-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono bg-red-950/20 font-bold hidden sm:inline">
              Rate Intelligence
            </span>
          </div>

          {/* Reasoning processes inside disclosure if thinking is present */}
          {aiThinking && (
            <details className="mb-6 bg-neutral-950/50 border border-neutral-850 rounded-xl overflow-hidden" open>
              <summary className="cursor-pointer text-[10px] font-semibold text-neutral-400 hover:text-red-400 p-3 select-none flex items-center gap-2 bg-neutral-950">
                <Cpu className="w-3.5 h-3.5 text-red-500 animate-spin" />
                <span>Inspect High-Thinking Deep Reasoning Process ({aiThinking.substring(0, 50)}...)</span>
              </summary>
              <div className="p-4 border-t border-neutral-900 bg-neutral-950/90 font-mono text-[10px] text-red-250/70 whitespace-pre-line leading-relaxed max-h-[160px] overflow-y-auto">
                {aiThinking}
              </div>
            </details>
          )}

          {aiLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-semibold text-neutral-200">AI Counselor is constructing dynamic matrices...</p>
                <p className="text-[10px] text-neutral-500 font-mono">Running side-by-side rates projection for {carMake} {carModel}</p>
              </div>
            </div>
          ) : aiError ? (
            <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs my-4">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{aiError}</span>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-neutral-300 font-sans space-y-4 select-text">
              {aiAnalysis.split('\n').map((line, idx) => {
                const cleanLine = line.trim();
                
                // MD Header 3
                if (cleanLine.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-sm sm:text-base font-bold font-display text-white mt-6 mb-2 border-b border-neutral-800 pb-1 flex items-center gap-2">
                      <div className="w-1.5 h-3 bg-red-550 rounded-sm" />
                      {cleanLine.replace('### ', '')}
                    </h3>
                  );
                }
                
                // MD Bullet
                if (cleanLine.startsWith('* ')) {
                  return (
                    <div key={idx} className="ml-4 pl-2 flex items-start gap-2 py-0.5 text-left">
                      <span className="text-red-500 mt-1 select-none">•</span>
                      <span>{cleanLine.replace('* ', '')}</span>
                    </div>
                  );
                }

                // Sub-points or numbers
                if (cleanLine.match(/^\d+\./)) {
                  return (
                    <div key={idx} className="bg-neutral-950 border border-neutral-850 p-4 rounded-xl mt-4 space-y-2 text-left relative overflow-hidden">
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-650" />
                      <p className="font-semibold text-white text-xs sm:text-sm">{cleanLine}</p>
                    </div>
                  );
                }

                if (cleanLine === '---') {
                  return <hr key={idx} className="border-neutral-800 my-4" />;
                }

                return <p key={idx} className="text-left select-text whitespace-pre-line leading-relaxed">{line}</p>;
              })}
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-neutral-820 flex justify-between items-center text-left text-[10px] text-neutral-500">
            <span className="font-mono">Reference application: ₱{price.toLocaleString()} Buyout Value</span>
            <span>Accredited Underwriting sponsorship simulation</span>
          </div>

        </div>
      )}

      {/* Standalone Interactive EMI Sandbox Layer */}
      <EMICalculator />
    </div>
  );
}
