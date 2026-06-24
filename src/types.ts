export interface LoanApplication {
  id: string;
  applicantName: string;
  applicantEmail: string;
  carMake: string;
  carModel: string;
  carYear: number;
  loanAmount: number;
  downPayment: number;
  termMonths: number;
  interestRate: number;
  monthlyPayment: number;
  creditScore: number;
  acquisitionMode?: 'FINANCING' | 'RENT_TO_OWN' | 'CASH';
  status: 'SUBMITTED' | 'DOCUMENTS_PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  statusUpdatedAt: string;
  createdAt: string;
  documents: UploadedDocument[];
  history: StatusHistoryItem[];
}

export interface StatusHistoryItem {
  id: string;
  status: 'SUBMITTED' | 'DOCUMENTS_PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  timestamp: string;
  description: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: string; // 'ID' | 'INCOME' | 'INSURANCE'
  size: number;
  uploadedAt: string;
}

export interface InterestRateOffer {
  id: string;
  brand: string;
  apr: number;
  estimatedPayment: number;
  rating: number;
  benefits: string[];
}

export interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  thinking?: string; // To showcase the Groq model reasoning output if desired
}

export interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  read: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApplicationFilters {
  status?: string;
  acquisitionMode?: string;
  search?: string;
  tenantId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'underwriter' | 'customer';
  tenantId: string;
  token: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  createdAt: string;
}

export interface AuthenticatedRequest {
  user?: User;
  query: any;
  body: any;
  headers: any;
  params: any;
  get: (header: string) => string | undefined;
}
