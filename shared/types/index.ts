export type CustomerType = 'individual' | 'corporate';
export type RiskRating = 'low' | 'medium' | 'high';
export type CddRequestStatus =
  | 'draft'
  | 'sent'
  | 'awaiting_docs'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'closed';
export type CddPriority = 'low' | 'normal' | 'high' | 'urgent';
export type DocumentType =
  | 'national_id'
  | 'passport'
  | 'proof_of_address'
  | 'source_of_funds'
  | 'corporate_registration'
  | 'other';
export type ValidationStatus = 'pending' | 'processing' | 'passed' | 'failed' | 'overridden';
export type ValidationVerdict = 'pass' | 'fail' | 'review_required';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Customer {
  id: string;
  externalRef?: string;
  name: string;
  email: string;
  phone?: string;
  customerType: CustomerType;
  riskRating: RiskRating;
  cddExpiryDate?: string;
  address?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CddRequest {
  id: string;
  customerId: string;
  customer?: Customer;
  referenceNumber: string;
  status: CddRequestStatus;
  priority: CddPriority;
  dueDate: string;
  assignedToId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  documentType: DocumentType;
  validationStatus: ValidationStatus;
  extractedData?: Record<string, unknown>;
  createdAt: string;
}

export interface ValidationResult {
  id: string;
  documentId: string;
  verdict: ValidationVerdict;
  confidenceScore: number;
  checks: Array<{ name: string; passed: boolean; message: string }>;
  extractedFields?: Record<string, string>;
  overrideReason?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  cddRequestId?: string;
  templateKey: string;
  recipient: string;
  subject: string;
  status: string;
  sentAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  entityType: string;
  entityId?: string;
  action: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface DashboardKpis {
  dueSoon: number;
  overdue: number;
  completionRate: number;
  pendingReview: number;
  totalCustomers: number;
  activeRequests: number;
}

export interface SearchResult {
  type: 'customer' | 'cdd_request' | 'document';
  id: string;
  title: string;
  subtitle: string;
  link: string;
}
