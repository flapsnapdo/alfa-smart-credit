// Типы ответов API — по docs/openapi.yaml. Все суммы в копейках.

export type ApplicationStatus =
  | 'DRAFT' | 'SUBMITTED' | 'VALIDATION' | 'INFO_REQUESTED' | 'ENRICHMENT' | 'SCORING'
  | 'MANUAL_REVIEW' | 'APPROVED' | 'COUNTER_OFFER' | 'SIGNING'
  | 'ISSUED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
export type Purpose = 'CASH_GAP' | 'WORKING_CAPITAL' | 'EQUIPMENT' | 'OTHER';
export type ProductCode = 'OVERDRAFT' | 'WORKING_CAPITAL' | 'EQUIPMENT';
export type DocType = 'FINANCIAL_STATEMENTS' | 'EQUIPMENT_INVOICE' | 'OTHER';
export type ActorType = 'CLIENT' | 'ANALYST' | 'SYSTEM';
export type DecisionType = 'APPROVE' | 'COUNTER_OFFER' | 'MANUAL_REVIEW' | 'REJECT';
export type Grade = 'A' | 'B' | 'C' | 'D';
export type NextAction =
  | 'FILL_DRAFT' | 'WAIT' | 'UPLOAD_DOCUMENT' | 'ACCEPT_OFFER' | 'ACCEPT_OR_DECLINE_OFFER' | 'SIGN' | 'NONE';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'CLIENT' | 'ANALYST';
}

export interface Company {
  id: string;
  inn: string;
  ogrn: string | null;
  type: 'LLC' | 'IE';
  name: string;
  status: 'ACTIVE' | 'LIQUIDATING' | 'LIQUIDATED' | 'BANKRUPT';
  registeredAt: string | null;
  okved: string | null;
  okvedName: string | null;
  address: string | null;
  directorName: string | null;
  position: 'OWNER' | 'CEO' | 'CFO' | 'ACCOUNTANT' | 'OTHER';
}

export interface Product {
  id: string;
  code: ProductCode;
  name: string;
  minAmount: number;
  maxAmount: number;
  minTerm: number;
  maxTerm: number;
  baseRate: number;
  autoDecisionLimit: number;
  annuity: boolean;
  requiredDocs: { docType: DocType; fromAmount: number }[];
}

export interface Recommendation {
  recommended: Product;
  alternative: Product | null;
  amount: number;
  term: number;
  rate: number;
  monthlyPayment: number;
  note: string;
}

export interface RegistryRecord {
  inn: string;
  ogrn: string;
  name: string;
  status: Company['status'];
  okved: string;
  okvedName: string;
  address: string;
  directorName: string;
}

export interface ClientView {
  title: string;
  text: string;
  nextAction: NextAction;
}

export interface Offer {
  productCode: ProductCode;
  amount: number;
  term: number;
  rate: number;
  monthlyPayment: number;
}

export interface Decision {
  type: DecisionType;
  rate: number | null;
  maxAvailableAmount: number;
  offer: Offer | null;
  alternatives: Offer[];
  reasons: string[];
}

export interface Application {
  id: string;
  number: string;
  status: ApplicationStatus;
  clientView: ClientView;
  company: { id: string; name: string; inn: string };
  product: { code: ProductCode; name: string };
  purpose: Purpose;
  requested: { amount: number; term: number };
  bkiConsentAt: string | null;
  submittedAt: string | null;
  decision: Decision | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationListItem {
  id: string;
  number: string;
  status: ApplicationStatus;
  clientView: ClientView;
  company: { id: string; name: string };
  product: { code: ProductCode; name: string };
  requested: { amount: number; term: number };
  updatedAt: string;
}

export interface StatusHistoryEntry {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  actorType: ActorType;
  reason: string | null;
  createdAt: string;
}

export interface Hint {
  code: string;
  text: string;
  points?: number;
  offer?: Offer;
}

export interface Explanation {
  score: number;
  grade: Grade;
  strengths: string[];
  weaknesses: string[];
  hints: Hint[];
  outlook: DecisionType | null;
}

export interface DocumentMeta {
  id: string;
  docType: DocType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface DocumentRequest {
  docType: DocType;
  title: string;
  comment: string | null;
  actorType: ActorType;
  fulfilledAt: string | null;
  createdAt: string;
}

export interface DocumentsInfo {
  documents: DocumentMeta[];
  missing: { docType: DocType; title: string; comment: string | null }[];
  requests: DocumentRequest[];
}

export interface Contract {
  number: string;
  status: ApplicationStatus;
  offer: Offer;
  signedAt: string | null;
  issuedAt: string | null;
  payoutId: string | null;
  demoSignCode: string | null;
}

export interface QueueItem {
  id: string;
  number: string;
  status: ApplicationStatus;
  company: { id: string; name: string; inn: string };
  product: { code: ProductCode; name: string };
  requested: { amount: number; term: number };
  score: number | null;
  grade: Grade | null;
  submittedAt: string | null;
}

export interface Factor {
  code: string;
  value: string;
  points: number;
  analystText: string;
  clientText: string;
}

export interface ScoringInput {
  businessAgeMonths: number;
  avgMonthlyRevenue: number;
  revenueLast6m: number;
  revenuePrev6m: number;
  currentMonthlyPayments: number;
  maxDelinquencyDays12m: number;
  currentDelinquencyDays: number;
  hasClosedLoans: boolean;
  inquiries30d: number;
  industryRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  hasTaxDebt: boolean;
}

export interface ExternalCheck {
  source: 'REGISTRY' | 'TAX' | 'BKI';
  ok: boolean;
  httpStatus: number | null;
  durationMs: number;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export interface AnalystCard {
  application: Application;
  checks: ExternalCheck[];
  scoring: {
    score: number;
    grade: Grade;
    factors: Factor[];
    stopFactors: { code: string; clientText: string }[];
    input: ScoringInput;
    rulesVersion: string;
    createdAt: string;
  } | null;
  decisions: (Decision & { actorType: ActorType; createdAt: string })[];
  history: StatusHistoryEntry[];
  documents: DocumentMeta[];
  documentRequests: DocumentRequest[];
}
