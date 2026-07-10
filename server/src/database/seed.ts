import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { entities, Permission, Role, RolePermission, User, UserRole, Customer, CddRequest, EmailTemplate, ReminderRule } from './entities';
import { ALL_PERMISSIONS, ROLE_PERMISSION_MAP } from './seed-permissions';
import {
  CustomerType,
  RiskRating,
  CddRequestStatus,
  CddPriority,
} from '../common/enums';

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'cdd_user',
    password: process.env.DB_PASSWORD || 'cdd_password',
    database: process.env.DB_DATABASE || 'cdd_renewal',
    entities,
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('Database connected. Seeding...');

  const permissionRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  const rolePermissionRepo = dataSource.getRepository(RolePermission);
  const userRepo = dataSource.getRepository(User);
  const userRoleRepo = dataSource.getRepository(UserRole);
  const customerRepo = dataSource.getRepository(Customer);
  const cddRepo = dataSource.getRepository(CddRequest);
  const templateRepo = dataSource.getRepository(EmailTemplate);
  const ruleRepo = dataSource.getRepository(ReminderRule);

  // Permissions
  const permissionMap = new Map<string, string>();
  for (const perm of ALL_PERMISSIONS) {
    let existing = await permissionRepo.findOne({ where: { key: perm.key } });
    if (!existing) {
      existing = await permissionRepo.save(perm);
    }
    permissionMap.set(perm.key, existing.id);
  }
  console.log(`Seeded ${permissionMap.size} permissions`);

  // Roles
  const roleMap = new Map<string, string>();
  const roleDefinitions = [
    { name: 'SuperAdmin', description: 'Full system administrator' },
    { name: 'ComplianceManager', description: 'CDD compliance manager' },
    { name: 'ComplianceOfficer', description: 'CDD compliance officer' },
    { name: 'Reviewer', description: 'CDD reviewer' },
    { name: 'Auditor', description: 'Read-only auditor' },
    { name: 'Viewer', description: 'Read-only viewer' },
  ];

  for (const roleDef of roleDefinitions) {
    let role = await roleRepo.findOne({ where: { name: roleDef.name } });
    if (!role) {
      role = await roleRepo.save(roleDef);
    }
    roleMap.set(roleDef.name, role.id);

    const permKeys = ROLE_PERMISSION_MAP[roleDef.name] || [];
    for (const key of permKeys) {
      const permissionId = permissionMap.get(key);
      if (!permissionId) continue;
      const exists = await rolePermissionRepo.findOne({
        where: { roleId: role.id, permissionId },
      });
      if (!exists) {
        await rolePermissionRepo.save({ roleId: role.id, permissionId });
      }
    }
  }
  console.log(`Seeded ${roleMap.size} roles with permissions`);

  // Users
  const users = [
    {
      email: 'admin@cdd.local',
      password: 'Admin123!',
      firstName: 'System',
      lastName: 'Admin',
      role: 'SuperAdmin',
    },
    {
      email: 'officer@cdd.local',
      password: 'Officer123!',
      firstName: 'Jane',
      lastName: 'Compliance',
      role: 'ComplianceOfficer',
    },
    {
      email: 'manager@cdd.local',
      password: 'Manager123!',
      firstName: 'Mark',
      lastName: 'Manager',
      role: 'ComplianceManager',
    },
    {
      email: 'viewer@cdd.local',
      password: 'Viewer123!',
      firstName: 'View',
      lastName: 'Only',
      role: 'Viewer',
    },
  ];

  for (const u of users) {
    let user = await userRepo.findOne({ where: { email: u.email } });
    if (!user) {
      const passwordHash = await bcrypt.hash(u.password, 12);
      user = await userRepo.save({
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        isActive: true,
      });
    }

    const roleId = roleMap.get(u.role);
    if (roleId) {
      const exists = await userRoleRepo.findOne({
        where: { userId: user.id, roleId },
      });
      if (!exists) {
        await userRoleRepo.save({ userId: user.id, roleId });
      }
    }
  }
  console.log(`Seeded ${users.length} users`);

  // Customers (50)
  const existingCustomers = await customerRepo.count();
  if (existingCustomers < 50) {
    const types = [CustomerType.INDIVIDUAL, CustomerType.CORPORATE];
    const risks = [RiskRating.LOW, RiskRating.MEDIUM, RiskRating.HIGH];
    const cities = ['Port Louis', 'Curepipe', 'Quatre Bornes', 'Rose Hill', 'Vacoas'];

    for (let i = existingCustomers + 1; i <= 50; i++) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + (i % 90) + 10);

      await customerRepo.save({
        externalRef: `CUST-${String(i).padStart(5, '0')}`,
        name: i % 3 === 0 ? `Corporate Entity ${i} Ltd` : `Customer ${i}`,
        email: `customer${i}@example.com`,
        phone: `+230 5${String(i).padStart(3, '0')} ${String(i * 7).padStart(4, '0')}`,
        customerType: types[i % types.length],
        riskRating: risks[i % risks.length],
        cddExpiryDate: expiry,
        address: `${cities[i % cities.length]}, Mauritius`,
        metadata: { segment: i % 2 === 0 ? 'retail' : 'corporate' },
      });
    }
    console.log('Seeded 50 customers');
  } else {
    console.log('Customers already seeded, skipping');
  }

  // Sample CDD requests
  const existingRequests = await cddRepo.count();
  if (existingRequests < 10) {
    const customers = await customerRepo.find({ take: 10, order: { createdAt: 'ASC' } });
    const statuses = [
      CddRequestStatus.DRAFT,
      CddRequestStatus.SENT,
      CddRequestStatus.AWAITING_DOCS,
      CddRequestStatus.UNDER_REVIEW,
      CddRequestStatus.APPROVED,
      CddRequestStatus.REJECTED,
    ];
    const priorities = [CddPriority.LOW, CddPriority.NORMAL, CddPriority.HIGH, CddPriority.URGENT];

    for (let i = 0; i < customers.length; i++) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (i + 1) * 7);

      await cddRepo.save({
        customerId: customers[i].id,
        referenceNumber: `CDD-2026-${String(100001 + i).padStart(6, '0')}`,
        status: statuses[i % statuses.length],
        priority: priorities[i % priorities.length],
        dueDate,
        notes: i % 2 === 0 ? 'Sample CDD renewal request' : null,
      });
    }
    console.log('Seeded sample CDD requests');
  } else {
    console.log('CDD requests already seeded, skipping');
  }

  // Email templates
  const templates = [
    {
      key: 'cdd-reminder',
      name: 'CDD Renewal Reminder',
      subject: 'CDD Renewal Required - {{referenceNumber}}',
      body: '<p>Dear Valued Client,</p><p>As part of our ongoing regulatory obligations, we need you to renew your Customer Due Diligence (CDD) records for request <strong>{{referenceNumber}}</strong> (due <strong>{{dueDate}}</strong>).</p><p>Please use the secure Customer Portal to:</p><ul><li>Confirm whether your critical risk details have changed</li><li>Upload the required documents (Proof of Address, NID, and other Annex A documents)</li></ul><p><a href="{{portalUrl}}" style="display:inline-block;padding:10px 16px;background:#0078d4;color:#ffffff;text-decoration:none;border-radius:4px;">Open Customer Portal</a></p><p>If the button does not work, copy this link:<br/>{{portalUrl}}</p><p>Regards,<br/>SICOM Compliance Team</p>',
    },
    {
      key: 'cdd-approved',
      name: 'CDD Approved Notification',
      subject: 'CDD Renewal Approved - {{referenceNumber}}',
      body: '<p>Dear Customer,</p><p>Your CDD renewal request <strong>{{referenceNumber}}</strong> has been approved.</p><p>Regards,<br/>Compliance Team</p>',
    },
    {
      key: 'cdd-rejected',
      name: 'CDD Rejected Notification',
      subject: 'CDD Renewal Requires Attention - {{referenceNumber}}',
      body: '<p>Dear Customer,</p><p>Your CDD renewal request <strong>{{referenceNumber}}</strong> requires additional information. Please contact us or use your Customer Portal link if it is still valid.</p><p>Regards,<br/>Compliance Team</p>',
    },
    {
      key: 'document-request',
      name: 'Document Request',
      subject: 'Documents Required - {{referenceNumber}}',
      body: '<p>Dear Customer,</p><p>Please upload the required Annex A documents for CDD request <strong>{{referenceNumber}}</strong> via the Customer Portal:</p><p><a href="{{portalUrl}}">{{portalUrl}}</a></p><p>Regards,<br/>Compliance Team</p>',
    },
  ];

  for (const t of templates) {
    const exists = await templateRepo.findOne({ where: { key: t.key } });
    if (!exists) {
      await templateRepo.save(t);
    } else {
      await templateRepo.update(exists.id, {
        subject: t.subject,
        body: t.body,
        name: t.name,
      });
    }
  }
  console.log(`Seeded ${templates.length} email templates`);

  // Reminder rules
  const rules = [
    { name: '30 days before due', daysBeforeDue: 30, templateKey: 'cdd-reminder' },
    { name: '14 days before due', daysBeforeDue: 14, templateKey: 'cdd-reminder' },
    { name: '7 days before due', daysBeforeDue: 7, templateKey: 'cdd-reminder' },
    { name: '1 day before due', daysBeforeDue: 1, templateKey: 'cdd-reminder' },
  ];

  for (const r of rules) {
    const exists = await ruleRepo.findOne({ where: { name: r.name } });
    if (!exists) {
      await ruleRepo.save({ ...r, isActive: true });
    }
  }
  console.log(`Seeded ${rules.length} reminder rules`);

  await dataSource.destroy();
  console.log('Seed completed successfully!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
