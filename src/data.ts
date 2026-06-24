import { LoanApplication } from './types';

export const CAR_MAKES = [
  { name: 'Tesla', baseRateAdjustment: -0.5, logo: '⚡' },
  { name: 'BMW', baseRateAdjustment: 0.2, logo: '🇩🇪' },
  { name: 'Mercedes-Benz', baseRateAdjustment: 0.3, logo: '⭐' },
  { name: 'Audi', baseRateAdjustment: 0.2, logo: '🔘' },
  { name: 'Toyota', baseRateAdjustment: -0.2, logo: '🇯🇵' },
  { name: 'Honda', baseRateAdjustment: -0.2, logo: '💨' },
  { name: 'Ford', baseRateAdjustment: 0.1, logo: '🇺🇸' },
  { name: 'Porsche', baseRateAdjustment: 0.6, logo: '🐎' },
];

export const CREDIT_TIERS = [
  { label: 'Excellent (750+)', minScore: 750, baseRate: 4.89, description: 'Superb financing options with minimum interest.' },
  { label: 'Very Good (700-749)', minScore: 700, baseRate: 5.95, description: 'Highly competitive prime interest rates.' },
  { label: 'Good (660-699)', minScore: 660, baseRate: 7.49, description: 'Standard consumer commercial loan rates.' },
  { label: 'Fair (600-659)', minScore: 600, baseRate: 10.25, description: 'Subprime terms; require higher down payment.' },
  { label: 'Rebuilding (< 600)', minScore: 350, baseRate: 14.99, description: 'Specialized financing channels available.' },
];

export const LOAN_TERMS = [24, 36, 48, 60, 72, 84];

export const INITIAL_APPLICATIONS: LoanApplication[] = [
  {
    id: 'TXN-940182',
    applicantName: 'Sarah Jenkins',
    applicantEmail: 'sarah.j@example.com',
    carMake: 'Tesla',
    carModel: 'Model Y',
    carYear: 2024,
    loanAmount: 48000,
    downPayment: 10000,
    termMonths: 60,
    interestRate: 4.39,
    monthlyPayment: 874.50,
    creditScore: 780,
    status: 'UNDER_REVIEW',
    statusUpdatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    documents: [
      { id: 'doc-1', name: 'Drivers_License_Sarah.png', type: 'ID', size: 1420500, uploadedAt: new Date(Date.now() - 3600000 * 23).toISOString() },
      { id: 'doc-2', name: 'Paystub_May2026.pdf', type: 'INCOME', size: 2310200, uploadedAt: new Date(Date.now() - 3600000 * 23).toISOString() },
    ],
    history: [
      { id: 'hist-1', status: 'SUBMITTED', timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), description: 'Loan application submitted matching Tesla Model Y configuration.' },
      { id: 'hist-2', status: 'DOCUMENTS_PENDING', timestamp: new Date(Date.now() - 3600000 * 23).toISOString(), description: 'Identity and income verification files requested by underwriter.' },
      { id: 'hist-3', status: 'UNDER_REVIEW', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), description: 'Required papers cleared. Loan documentation passed to primary underwriter.' },
    ],
  },
  {
    id: 'TXN-882351',
    applicantName: 'Marcus Bennett',
    applicantEmail: 'm.bennett@example.com',
    carMake: 'BMW',
    carModel: 'M4 Competition',
    carYear: 2023,
    loanAmount: 72000,
    downPayment: 15000,
    termMonths: 48,
    interestRate: 6.15,
    monthlyPayment: 1695.40,
    creditScore: 710,
    status: 'DOCUMENTS_PENDING',
    statusUpdatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    documents: [],
    history: [
      { id: 'hist-11', status: 'SUBMITTED', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), description: 'Loan application submitted for pre-owned BMW M4 Competition.' },
      { id: 'hist-12', status: 'DOCUMENTS_PENDING', timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), description: 'Waiting for identity documents (valid state Drivers License).' },
    ],
  }
];
