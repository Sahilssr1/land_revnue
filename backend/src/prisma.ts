import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const ROLES = {
  SuperAdmin: 'SuperAdmin',
  DistrictOfficer: 'DistrictOfficer',
  CircleOfficer: 'CircleOfficer',
  RevenueEmployee: 'RevenueEmployee',
  Amin: 'Amin',
  Citizen: 'Citizen',
} as const;

export const STAFF = ['SuperAdmin', 'DistrictOfficer', 'CircleOfficer', 'RevenueEmployee', 'Amin'];
export const APPROVERS = ['SuperAdmin', 'DistrictOfficer', 'CircleOfficer'];

export const STATUS = {
  Pending: 'Pending',
  UnderReview: 'UnderReview',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Paid: 'Paid',
  Unpaid: 'Unpaid',
  Assigned: 'Assigned',
  Completed: 'Completed',
  Resolved: 'Resolved',
  InProgress: 'InProgress',
} as const;
