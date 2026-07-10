export interface PermissionDefinition {
  key: string;
  name: string;
  module: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // Customers
  { key: 'customers:read', name: 'View customers', module: 'customers' },
  { key: 'customers:write', name: 'Manage customers', module: 'customers' },
  { key: 'customers:import', name: 'Import customers', module: 'customers' },

  // CDD Requests
  { key: 'cdd-requests:read', name: 'View CDD requests', module: 'cdd-requests' },
  { key: 'cdd-requests:write', name: 'Manage CDD requests', module: 'cdd-requests' },
  { key: 'cdd-requests:send-reminder', name: 'Send CDD reminders', module: 'cdd-requests' },

  // Documents
  { key: 'documents:read', name: 'View documents', module: 'documents' },
  { key: 'documents:write', name: 'Manage documents', module: 'documents' },
  { key: 'documents:upload', name: 'Upload documents', module: 'documents' },
  { key: 'documents:download', name: 'Download documents', module: 'documents' },

  // Document Validation
  { key: 'document-validation:read', name: 'View validation results', module: 'document-validation' },
  { key: 'document-validation:write', name: 'Run document validation', module: 'document-validation' },
  { key: 'document-validation:override', name: 'Override validation results', module: 'document-validation' },

  // Emails
  { key: 'emails:read', name: 'View email templates and logs', module: 'emails' },
  { key: 'emails:write', name: 'Manage email templates', module: 'emails' },
  { key: 'emails:send', name: 'Send emails', module: 'emails' },

  // Notifications
  { key: 'notifications:read', name: 'View notifications', module: 'notifications' },
  { key: 'notifications:write', name: 'Manage notifications', module: 'notifications' },

  // Reports
  { key: 'reports:read', name: 'View reports', module: 'reports' },
  { key: 'reports:export', name: 'Export reports', module: 'reports' },

  // Audit Logs
  { key: 'audit-logs:read', name: 'View audit logs', module: 'audit-logs' },

  // Dashboard
  { key: 'dashboard:read', name: 'View dashboard', module: 'dashboard' },

  // Search
  { key: 'search:read', name: 'Global search', module: 'search' },

  // Administration
  { key: 'administration:read', name: 'View administration settings', module: 'administration' },
  { key: 'administration:write', name: 'Manage administration settings', module: 'administration' },

  // Users
  { key: 'users:read', name: 'View users', module: 'users' },
  { key: 'users:write', name: 'Manage users', module: 'users' },

  // Roles
  { key: 'roles:read', name: 'View roles and permissions', module: 'roles' },

  // Jobs
  { key: 'jobs:read', name: 'View background jobs', module: 'jobs' },
  { key: 'jobs:manage', name: 'Manage background jobs', module: 'jobs' },

  // Integrations
  { key: 'integrations:read', name: 'View integrations', module: 'integrations' },
  { key: 'integrations:write', name: 'Manage integrations', module: 'integrations' },
];

export const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  SuperAdmin: ALL_PERMISSIONS.map((p) => p.key),
  ComplianceManager: [
    'customers:read',
    'customers:write',
    'customers:import',
    'cdd-requests:read',
    'cdd-requests:write',
    'cdd-requests:send-reminder',
    'documents:read',
    'documents:upload',
    'documents:download',
    'document-validation:read',
    'document-validation:write',
    'document-validation:override',
    'emails:read',
    'emails:write',
    'emails:send',
    'notifications:read',
    'reports:read',
    'reports:export',
    'dashboard:read',
    'search:read',
    'audit-logs:read',
    'administration:read',
    'administration:write',
    'jobs:read',
    'integrations:read',
  ],
  ComplianceOfficer: [
    'customers:read',
    'customers:write',
    'cdd-requests:read',
    'cdd-requests:write',
    'cdd-requests:send-reminder',
    'documents:read',
    'documents:upload',
    'documents:download',
    'document-validation:read',
    'document-validation:write',
    'document-validation:override',
    'emails:read',
    'emails:send',
    'notifications:read',
    'reports:read',
    'reports:export',
    'dashboard:read',
    'search:read',
    'audit-logs:read',
  ],
  Reviewer: [
    'customers:read',
    'cdd-requests:read',
    'documents:read',
    'documents:download',
    'document-validation:read',
    'document-validation:write',
    'notifications:read',
    'dashboard:read',
    'search:read',
  ],
  Auditor: [
    'customers:read',
    'cdd-requests:read',
    'documents:read',
    'document-validation:read',
    'emails:read',
    'reports:read',
    'reports:export',
    'audit-logs:read',
    'dashboard:read',
    'search:read',
  ],
  Viewer: [
    'customers:read',
    'cdd-requests:read',
    'documents:read',
    'document-validation:read',
    'emails:read',
    'notifications:read',
    'reports:read',
    'dashboard:read',
    'search:read',
  ],
};
