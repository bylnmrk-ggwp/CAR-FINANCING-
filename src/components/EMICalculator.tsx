import React, { useState, useEffect } from 'react';
import { 
  Calculator, Percent, Calendar, Coins, ArrowRight, Sparkles, 
  TrendingUp, Table, HelpCircle, ShieldCheck, CheckCircle2, Info 
} from 'lucide-react';

export default function EMICalculator() {
  // Inputs
  const [loanAmount, setLoanAmount] = useState<number>(500000);
  const [interestRate, setInterestRate] = useState<number>(7.5);
  const [loanTerm, setLoanTerm] = useState<number>(60);
  
  // Extra prepayment options for "Visual Breakdown" insight
  const [extraMonthly, setExtraMonthly] = useState<number>(0);

  // Computed results states
  const [emi, setEmi] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalRepayment, setTotalRepayment] = useState<number>(0);
  const [interestRatio, setInterestRatio] = useState<number>(0); // Percentage of total payment that is interest
  const [schedule, setSchedule] = useState<{
    year: number;
    principalPaid: number;
    interestPaid: number;
    remainingBalance: number;
  }[]>([]);

  // Calculate live results whenever inputs shift
  useEffect(() => {
    const P = loanAmount;
    const annualR = interestRate;
    const n = loanTerm;

    if (P <= 0) {
      setEmi(0);
      setTotalInterest(0);
      setTotalRepayment(0);
      setInterestRatio(0);
      setSchedule([]);
      return;
    }

    const r = annualR / 12 / 100;

    let monthlyPayment = 0;
    if (r === 0) {
      monthlyPayment = P / n;
    } else {
      monthlyPayment = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const totalRepay = monthlyPayment * n;
    const cumulativeInterest = Math.max(0, totalRepay - P);
    const ratio = totalRepay > 0 ? (cumulativeInterest / totalRepay) * 100 : 0;

    setEmi(monthlyPayment);
    setTotalInterest(cumulativeInterest);
    setTotalRepayment(totalRepay);
    setInterestRatio(ratio);

    // Amortization Schedule Calculation (grouped by Year)
    let balance = P;
    const calculatedSchedule = [];
    let yearPrincipal = 0;
    let yearInterest = 0;

    for (let month = 1; month <= n; month++) {
      const interestForMonth = balance * r;
      const principalForMonth = monthlyPayment - interestForMonth;
      
      yearPrincipal += principalForMonth;
      yearInterest += interestForMonth;
      balance = Math.max(0, balance - principalForMonth);

      if (month % 12 === 0 || month === n) {
        calculatedSchedule.push({
          year: Math.ceil(month / 12),
          principalPaid: yearPrincipal,
          interestPaid: yearInterest,
          remainingBalance: balance,
        });
        yearPrincipal = 0;
        yearInterest = 0;
      }
    }
    setSchedule(calculatedSchedule);

  }, [loanAmount, interestRate, loanTerm]);

  return (
    <div id="emi-calculator-component" className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 text-left shadow-2xl relative overflow-hidden text-white mt-12">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-red-600/5 blur-3xl rounded-full pointer-events-none select-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-red-650/5 blur-3xl rounded-full pointer-events-none select-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-800 pb-5 mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 bg-red-950/40 border border-red-500/20 text-red-500 rounded-2xl">
            <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-red-500">Live Simulation Sandbox</span>
            <h3 className="text-lg sm:text-2xl font-bold font-display text-white">Standalone EMI Lab</h3>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-neutral-950 px-3.5 py-1.5 rounded-full border border-neutral-850">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span className="text-[10px] font-mono text-neutral-400">Installs Mapped in real-time</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INPUT COLUMN (5/12 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <h4 className="text-xs font-bold tracking-wider text-neutral-400 uppercase font-display border-b border-neutral-800 pb-2">
            Configure Custom Loan Inputs
          </h4>

          {/* Loan Amount Input + Slider */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-neutral-400" />
                Loan Principal
              </label>
              <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1 font-mono text-sm font-semibold text-red-500">
                <span className="mr-0.5 text-xs text-red-400">₱</span>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Math.max(0, Number(e.target.value)))}
                  className="bg-transparent border-none outline-none focus:ring-0 text-right w-24 p-0 text-white"
                />
              </div>
            </div>
            <input
              type="range"
              min="10000"
              max="5000000"
              step="5000"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full accent-red-500 h-1 rounded-lg bg-neutral-950 appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1 font-semibold">
              <span>₱10,000</span>
              <span>₱2.5M</span>
              <span>₱5.0M</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-neutral-400" />
                Annual Interest Rate
              </label>
              <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1 font-mono text-sm font-semibold text-red-500">
                <input
                  type="number"
                  step="0.05"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                  className="bg-transparent border-none outline-none focus:ring-0 text-right w-16 p-0 text-white"
                />
                <span className="ml-1 text-xs text-neutral-400">%</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full accent-red-500 h-1 rounded-lg bg-neutral-950 appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1 font-semibold">
              <span>1.0% Rate</span>
              <span>15%</span>
              <span>30% APR</span>
            </div>
          </div>

          {/* Loan Duration / Term */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                Duration Period (Months)
              </label>
              <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1 font-mono text-sm font-semibold text-red-500">
                <input
                  type="number"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(Math.max(1, Number(e.target.value)))}
                  className="bg-transparent border-none outline-none focus:ring-0 text-right w-12 p-0 text-white"
                />
                <span className="ml-1 text-xs text-neutral-400">Mo</span>
              </div>
            </div>
            <input
              type="range"
              min="6"
              max="120"
              step="6"
              value={loanTerm}
              onChange={(e) => setLoanTerm(Number(e.target.value))}
              className="w-full accent-red-500 h-1 rounded-lg bg-neutral-950 appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1 font-semibold">
              <span>6 Months</span>
              <span>60m (5 Years)</span>
              <span>120 Months</span>
            </div>
          </div>

          {/* Optional prepayment simulation to make visual breakdown premium */}
          <div className="bg-neutral-950/40 border border-neutral-850 p-4 rounded-xl relative overflow-hidden">
            <div className="flex items-start gap-2.5 text-left">
              <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-neutral-300 block uppercase tracking-wider">Dynamic Slider Tips</span>
                <p className="text-[10px] text-neutral-400 leading-relaxed mt-1">
                  Adjust Loan Term or reduce Principal configuration to observe live reductions in the absolute Cumulative Interest load. Use this lab as an underwriting benchmark tool!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* OUTPUT STATS PANEL + VISUAL BREAKDOWN (7/12 columns) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <h4 className="text-xs font-bold tracking-wider text-neutral-400 uppercase font-display border-b border-neutral-800 pb-2">
              EMI Output Projections
            </h4>

            {/* Giant computed EMI box */}
            <div className="bg-gradient-to-br from-[#121212] to-[#0d0d0d] border border-neutral-800 rounded-2xl p-6 text-center relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-red-600/5 blur-3xl rounded-full" />
              
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                Calculated Monthly Installment (EMI)
              </span>
              <div className="flex items-baseline justify-center gap-1 mt-2.5">
                <span className="text-3xl sm:text-5xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-r from-white via-red-200 to-red-400">
                  ₱{emi.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm font-medium text-neutral-400">/month</span>
              </div>
            </div>

            {/* Core statistics breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 text-left">
                <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider block">Total Interest Accrued</span>
                <span className="text-lg font-bold font-mono text-white mt-1 block">
                  ₱{totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-500">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  <span>Surcharge ratio of {interestRatio.toFixed(1)}%</span>
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-left">
                <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider block">Total Cumulative Payback</span>
                <span className="text-lg font-bold font-mono text-red-400 mt-1 block">
                  ₱{totalRepayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[9.5px] text-neutral-400 mt-2 block leading-relaxed">
                  Principal ₱{loanAmount.toLocaleString()} + Interest
                </span>
              </div>
            </div>

            {/* PREMIUM VISUAL COMPOSITION BAR */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] text-neutral-400 font-semibold uppercase">
                <span>Principal Composition</span>
                <span>Interest Load</span>
              </div>
              
              {/* Progress-ratio split bar */}
              <div className="h-3 w-full bg-neutral-950 rounded-full flex overflow-hidden border border-neutral-855">
                <div 
                  className="bg-red-555 transition-all duration-350" 
                  style={{ width: `${100 - interestRatio}%`, backgroundColor: '#e11d48' }} 
                  title={`Principal: ${(100 - interestRatio).toFixed(1)}%`}
                />
                <div 
                  className="bg-amber-550 transition-all duration-350" 
                  style={{ width: `${interestRatio}%`, backgroundColor: '#d97706' }} 
                  title={`Interest: ${interestRatio.toFixed(1)}%`}
                />
              </div>

              {/* Composition labels */}
              <div className="flex justify-between items-center text-[10px] font-mono mt-1">
                <span className="text-neutral-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-600 block" />
                  Principal ({(100 - interestRatio).toFixed(1)}%)
                </span>
                <span className="text-amber-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-600 block" />
                  Interest ({interestRatio.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* AMORTIZATION SCHEDULE BREAKDOWN TABLE (Full width underneath) */}
      {schedule.length > 0 && (
        <div className="mt-8 pt-6 border-t border-neutral-800">
          <div className="flex items-center gap-2 mb-4">
            <Table className="w-4 h-4 text-red-500" />
            <h4 className="text-xs font-bold tracking-wider text-neutral-300 uppercase font-display">
              Year-by-Year Amortization Schedule
            </h4>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-850 bg-neutral-950/60">
            <table className="w-full text-left font-mono text-xs text-neutral-300 min-w-[500px]">
              <thead className="bg-neutral-950 text-neutral-400 text-[10px] uppercase font-sans font-bold">
                <tr>
                  <th className="p-3">Period</th>
                  <th className="p-3">Principal Restored</th>
                  <th className="p-3">Interest Overhead</th>
                  <th className="p-3">Total Annual Cost</th>
                  <th className="p-3 text-right">Remaining Loan Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 leading-normal">
                {schedule.map((row) => (
                  <tr key={row.year} className="hover:bg-neutral-900/35 transition-colors">
                    <td className="p-3 font-sans font-bold text-neutral-300">Year {row.year}</td>
                    <td className="p-3 text-white">₱{row.principalPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="p-3 text-amber-500">₱{row.interestPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="p-3 text-neutral-400">
                      ₱{(row.principalPaid + row.interestPaid).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="p-3 text-right font-bold text-red-400">
                      ₱{row.remainingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-[10px] text-neutral-500 font-sans">
            <span>*Based on fixed interest compounding calculation with standardized monthly amortization periods.</span>
            <span>Accurate to within ₱1.00 variance.</span>
          </div>
        </div>
      )}

    </div>
  );
}
