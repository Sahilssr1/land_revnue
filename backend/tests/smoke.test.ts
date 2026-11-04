import assert from 'node:assert';
import test from 'node:test';
import { openApiSpec } from '../src/openapi';

// Smoke tests that need no database: the API contract surface must expose
// every route ARCHITECTURE.md requires, and role/status vocabularies must match.
const REQUIRED_PATHS = [
  '/api/auth/register', '/api/auth/login', '/api/auth/refresh', '/api/auth/logout',
  '/api/dashboard/admin-stats', '/api/dashboard/citizen-stats', '/api/dashboard/revenue-monthly',
  '/api/dashboard/mutation-stats', '/api/dashboard/district-records', '/api/dashboard/approval-trends',
  '/api/land-records', '/api/jamabandi', '/api/mutations', '/api/mutations/{id}/approve',
  '/api/mutations/{id}/reject', '/api/mutations/{id}/request-documents', '/api/mutations/{id}/assign',
  '/api/revenue/rates', '/api/revenue/payments', '/api/surveys', '/api/certificates/applications',
  '/api/certificates/applications/{id}/issue', '/api/complaints', '/api/complaints/disputes',
  '/api/admin/users', '/api/admin/users/{id}/activate', '/api/admin/users/{id}/deactivate',
  '/api/admin/masters/districts', '/api/reports/district', '/api/reports/revenue', '/api/reports/mutation',
  '/api/reports/ownership', '/api/reports/survey', '/api/reports/employee',
  '/api/notifications', '/api/audit-logs', '/api/webhooks/razorpay',
];

test('openapi spec covers every required API path', () => {
  for (const p of REQUIRED_PATHS) assert.ok(openApiSpec.paths[p], `missing path ${p}`);
});

test('openapi spec declares bearer auth and the six roles', () => {
  assert.equal(openApiSpec.components.securitySchemes.bearerAuth.scheme, 'bearer');
  const userSchema = openApiSpec.components.schemas.User as { properties: { role: { enum: string[] } } };
  assert.deepEqual(userSchema.properties.role.enum, ['SuperAdmin', 'DistrictOfficer', 'CircleOfficer', 'RevenueEmployee', 'Amin', 'Citizen']);
});

test('openapi info states this is not an official government system', () => {
  assert.match(openApiSpec.info.description, /NOT an official/);
});
