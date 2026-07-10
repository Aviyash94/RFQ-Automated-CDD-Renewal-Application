export enum CustomerType {
  INDIVIDUAL = 'individual',
  CORPORATE = 'corporate',
}

export enum RiskRating {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum CddRequestStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  AWAITING_DOCS = 'awaiting_docs',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CLOSED = 'closed',
}

export enum CddPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum DocumentType {
  NATIONAL_ID = 'national_id',
  PASSPORT = 'passport',
  PROOF_OF_ADDRESS = 'proof_of_address',
  RELATIONSHIP_DOCUMENT = 'relationship_document',
  SOURCE_OF_FUNDS = 'source_of_funds',
  FINANCIAL_STATEMENTS = 'financial_statements',
  REGISTER_DIRECTORS_SHAREHOLDERS = 'register_directors_shareholders',
  UBO_DECLARATION = 'ubo_declaration',
  DIRECTOR_KYC = 'director_kyc',
  CORPORATE_REGISTRATION = 'corporate_registration',
  OTHER = 'other',
}

export enum ValidationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PASSED = 'passed',
  FAILED = 'failed',
  OVERRIDDEN = 'overridden',
}

export enum ValidationVerdict {
  PASS = 'pass',
  FAIL = 'fail',
  REVIEW_REQUIRED = 'review_required',
}

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

export enum ImportBatchStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum JobRunStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  SUCCESS = 'success',
  ERROR = 'error',
}
