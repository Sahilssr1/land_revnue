// Fictional demo data only. No real citizen data. Bihar-style districts, invented names/numbers.
export type Land = { id: string; district: string; circle: string; mauza: string; village: string; khata: string; khesra: string; plot: string; owner: string; area: number; classification: string; status: string; lat: number; lng: number; ownerId?: string };
export const districts = ['Patna', 'Gaya', 'Muzaffarpur'];
export const circles: Record<string, string[]> = { Patna: ['Patna Sadar', 'Danapur', 'Phulwari'], Gaya: ['Gaya Sadar', 'Bodh Gaya'], Muzaffarpur: ['Muzaffarpur East', 'Motihari Road'] };
export const landRecords: Land[] = [
  { id: 'LR-001', district: 'Patna', circle: 'Patna Sadar', mauza: 'Phulwari', village: 'Phulwari Sharif', khata: 'KH-142', khesra: 'KH-142/58', plot: 'P-58', owner: 'Ramesh Kumar', area: 2.45, classification: 'Agricultural', status: 'Approved', lat: 25.5941, lng: 85.1376 },
  { id: 'LR-002', district: 'Patna', circle: 'Danapur', mauza: 'Danapur', village: 'Danapur Cantt', khata: 'KH-087', khesra: 'KH-087/12', plot: 'P-12', owner: 'Sunita Devi', area: 1.20, classification: 'Residential', status: 'Approved', lat: 25.6350, lng: 85.0450 },
  { id: 'LR-003', district: 'Gaya', circle: 'Gaya Sadar', mauza: 'Tekari', village: 'Tekari', khata: 'KH-203', khesra: 'KH-203/91', plot: 'P-91', owner: 'Anil Prasad', area: 3.80, classification: 'Agricultural', status: 'UnderReview', lat: 24.7955, lng: 85.0030 },
  { id: 'LR-004', district: 'Muzaffarpur', circle: 'Muzaffarpur East', mauza: 'Motihari', village: 'Motihari', khata: 'KH-056', khesra: 'KH-056/33', plot: 'P-33', owner: 'Priya Sharma', area: 0.85, classification: 'Commercial', status: 'Approved', lat: 26.1226, lng: 85.3906 },
  { id: 'LR-005', district: 'Patna', circle: 'Phulwari', mauza: 'Phulwari', village: 'Anisabad', khata: 'KH-310', khesra: 'KH-310/07', plot: 'P-07', owner: 'Vikash Singh', area: 1.65, classification: 'Homestead', status: 'Pending', lat: 25.5800, lng: 85.1100 },
  { id: 'LR-006', district: 'Gaya', circle: 'Bodh Gaya', mauza: 'Bodh Gaya', village: 'Bodh Gaya', khata: 'KH-118', khesra: 'KH-118/44', plot: 'P-44', owner: 'Meena Kumari', area: 2.10, classification: 'Agricultural', status: 'Approved', lat: 24.6950, lng: 84.9900 },
  { id: 'LR-007', district: 'Muzaffarpur', circle: 'Motihari Road', mauza: 'Parsa', village: 'Parsa', khata: 'KH-172', khesra: 'KH-172/21', plot: 'P-21', owner: 'Rajesh Yadav', area: 4.20, classification: 'Agricultural', status: 'Approved', lat: 26.1500, lng: 85.4200 },
  { id: 'LR-008', district: 'Patna', circle: 'Patna Sadar', mauza: 'Kankarbagh', village: 'Kankarbagh', khata: 'KH-095', khesra: 'KH-095/60', plot: 'P-60', owner: 'Demo Citizen', area: 1.50, classification: 'Residential', status: 'Approved', lat: 25.6000, lng: 85.1600 },
];
export const adminStats = { totalCitizens: 12840, totalLandRecords: 48210, totalMutations: 3240, pending: 486, approved: 2412, rejected: 342, revenueCollected: 18425000, pendingRevenue: 3420000, activeDisputes: 127, recentActivities: [
  { id: '1', text: 'Mutation LRMS-2026-004821 approved by Circle Officer, Patna Sadar', time: '10 min ago' },
  { id: '2', text: 'Revenue payment ₹4,250 received for Khata KH-142', time: '32 min ago' },
  { id: '3', text: 'LPC certificate issued — Ref LRMS-2026-009314', time: '1 hr ago' },
  { id: '4', text: 'Survey assigned to Amin for Khesra KH-203/91, Gaya', time: '2 hrs ago' },
  { id: '5', text: 'Complaint C-1182 resolved — boundary dispute, Danapur', time: '3 hrs ago' },
]};
export const citizenStats = { myLand: 2, totalArea: 3.95, mutations: 3, pending: 1, revenueStatus: 'Unpaid', certificates: 1, recent: [
  { id: '1', text: 'Mutation application submitted — Tracking LRMS-2026-004821', time: 'Yesterday' },
  { id: '2', text: 'Revenue due ₹2,150 for Khata KH-095', time: '2 days ago' },
  { id: '3', text: 'LPC certificate approved — download available', time: '5 days ago' },
]};
export const revenueMonthly = [{ month: 'Jun', amount: 1240000 }, { month: 'Jul', amount: 1480000 }, { month: 'Aug', amount: 1320000 }, { month: 'Sep', amount: 1710000 }, { month: 'Oct', amount: 1980000 }, { month: 'Nov', amount: 1620000 }];
export const mutationStats = [{ name: 'Pending', value: 486 }, { name: 'UnderReview', value: 312 }, { name: 'Approved', value: 2412 }, { name: 'Rejected', value: 342 }];
export const districtRecords = [{ district: 'Patna', records: 21480 }, { district: 'Gaya', records: 15320 }, { district: 'Muzaffarpur', records: 11410 }];
export const approvalTrends = [{ month: 'Jun', approved: 380, rejected: 52 }, { month: 'Jul', approved: 410, rejected: 48 }, { month: 'Aug', approved: 395, rejected: 61 }, { month: 'Sep', approved: 445, rejected: 44 }, { month: 'Oct', approved: 470, rejected: 39 }, { month: 'Nov', approved: 312, rejected: 28 }];
export const mutations = [
  { id: 'M-101', tracking: 'LRMS-2026-004821', landId: 'LR-001', seller: 'Ramesh Kumar', buyer: 'Demo Citizen', district: 'Patna', status: 'UnderReview', date: '2026-11-02', assignedTo: 'Revenue Employee — Patna Sadar', docs: ['Sale Deed (PDF)', 'ID Proof (JPG)'], audit: ['Submitted 2026-11-02', 'Documents verified 2026-11-03'] },
  { id: 'M-102', tracking: 'LRMS-2026-004790', landId: 'LR-003', seller: 'Anil Prasad', buyer: 'Suresh Kumar', district: 'Gaya', status: 'Pending', date: '2026-11-01', assignedTo: 'Unassigned', docs: ['Sale Deed (PDF)'], audit: ['Submitted 2026-11-01'] },
  { id: 'M-103', tracking: 'LRMS-2026-004755', landId: 'LR-004', seller: 'Priya Sharma', buyer: 'Amit Verma', district: 'Muzaffarpur', status: 'Approved', date: '2026-10-28', assignedTo: 'Circle Officer', docs: ['Sale Deed (PDF)', 'Mutation Form (PDF)'], audit: ['Submitted 2026-10-28', 'Approved 2026-10-30'] },
  { id: 'M-104', tracking: 'LRMS-2026-004720', landId: 'LR-005', seller: 'Vikash Singh', buyer: 'Neha Gupta', district: 'Patna', status: 'Rejected', date: '2026-10-25', assignedTo: 'Circle Officer', docs: ['Sale Deed (PDF)'], audit: ['Submitted 2026-10-25', 'Rejected — incomplete documents'] },
];
export const jamabandi = landRecords.map((l) => ({ ...l, jamabandiNo: `JB-${l.khata}`, year: '2026-27', remarks: 'As per last approved mutation' }));
export const revenueRates = [
  { id: 'R-1', classification: 'Agricultural', rate: 120, unit: 'per decimal / year' },
  { id: 'R-2', classification: 'Residential', rate: 350, unit: 'per decimal / year' },
  { id: 'R-3', classification: 'Commercial', rate: 850, unit: 'per decimal / year' },
  { id: 'R-4', classification: 'Homestead', rate: 200, unit: 'per decimal / year' },
];
export const payments = [
  { id: 'P-201', landId: 'LR-001', khata: 'KH-142', amount: 4250, status: 'Paid', date: '2026-11-03', receipt: 'LRMS-2026-009301' },
  { id: 'P-202', landId: 'LR-008', khata: 'KH-095', amount: 2150, status: 'Unpaid', date: '2026-11-01', receipt: '—' },
  { id: 'P-203', landId: 'LR-004', khata: 'KH-056', amount: 6800, status: 'Paid', date: '2026-10-29', receipt: 'LRMS-2026-009288' },
];
export const surveys = [
  { id: 'S-301', landId: 'LR-003', khesra: 'KH-203/91', officer: 'Amin — Gaya Sadar', status: 'Assigned', date: '2026-11-03', appointment: '2026-11-07 10:00 AM' },
  { id: 'S-302', landId: 'LR-002', khesra: 'KH-087/12', officer: 'Unassigned', status: 'Pending', date: '2026-11-02', appointment: '—' },
  { id: 'S-303', landId: 'LR-007', khesra: 'KH-172/21', officer: 'Amin — Muzaffarpur East', status: 'Completed', date: '2026-10-27', appointment: '2026-10-30 11:00 AM' },
];
export const certificates = [
  { id: 'C-401', type: 'LPC', applicant: 'Demo Citizen', landId: 'LR-008', status: 'Approved', ref: 'LRMS-2026-009314', date: '2026-10-30' },
  { id: 'C-402', type: 'LPC', applicant: 'Sunita Devi', landId: 'LR-002', status: 'UnderReview', ref: '—', date: '2026-11-02' },
  { id: 'C-403', type: 'LPC', applicant: 'Anil Prasad', landId: 'LR-003', status: 'Pending', ref: '—', date: '2026-11-01' },
];
export const complaints = [
  { id: 'C-1181', subject: 'Boundary dispute — Plot P-58', citizen: 'Ramesh Kumar', status: 'InProgress', officer: 'Circle Officer, Patna Sadar', remarks: ['Assigned to officer', 'Site visit scheduled 2026-11-06'], date: '2026-11-01' },
  { id: 'C-1182', subject: 'Wrong owner name in Jamabandi', citizen: 'Demo Citizen', status: 'Resolved', officer: 'Revenue Employee', remarks: ['Verified records', 'Name corrected'], date: '2026-10-28' },
  { id: 'C-1183', subject: 'Mutation delayed beyond 30 days', citizen: 'Priya Sharma', status: 'Pending', officer: 'Unassigned', remarks: [], date: '2026-11-03' },
];
export const disputes = [{ id: 'D-501', caseNo: 'DISP/2026/501', parties: 'Ramesh Kumar vs Vikash Singh', landId: 'LR-001', status: 'InProgress', date: '2026-10-20' }];
export const users = [
  { id: 'U-1', name: 'Admin User', email: 'admin@lrms.demo', role: 'SuperAdmin', district: 'All', active: true },
  { id: 'U-2', name: 'Circle Officer Patna', email: 'officer@lrms.demo', role: 'CircleOfficer', district: 'Patna', active: true },
  { id: 'U-3', name: 'Demo Citizen', email: 'citizen@lrms.demo', role: 'Citizen', district: 'Patna', active: true },
  { id: 'U-4', name: 'Amin Gaya', email: 'amin@lrms.demo', role: 'Amin', district: 'Gaya', active: true },
  { id: 'U-5', name: 'Revenue Employee Danapur', email: 'rev@lrms.demo', role: 'RevenueEmployee', district: 'Patna', active: false },
];
export const notifications = [
  { id: 'N-1', title: 'Mutation submitted', body: 'Tracking LRMS-2026-004821 received.', date: '2026-11-02', read: false },
  { id: 'N-2', title: 'Payment confirmed', body: '₹4,250 received for Khata KH-142.', date: '2026-11-03', read: false },
  { id: 'N-3', title: 'Certificate approved', body: 'LPC LRMS-2026-009314 ready to download.', date: '2026-10-30', read: true },
];
export const auditLogs = [
  { id: 'A-1', user: 'officer@lrms.demo', action: 'APPROVE_MUTATION', target: 'M-103', date: '2026-10-30 11:20' },
  { id: 'A-2', user: 'admin@lrms.demo', action: 'CREATE_USER', target: 'U-4', date: '2026-10-29 09:05' },
  { id: 'A-3', user: 'rev@lrms.demo', action: 'VERIFY_DOCUMENT', target: 'M-101', date: '2026-11-03 14:10' },
];
export const masters = { districts, circles, mauzas: ['Phulwari', 'Danapur', 'Tekari', 'Bodh Gaya', 'Motihari', 'Parsa'], villages: ['Phulwari Sharif', 'Danapur Cantt', 'Tekari', 'Bodh Gaya', 'Motihari', 'Anisabad', 'Kankarbagh'] };
export function newTracking(): string { const n = Math.floor(100000 + Math.random() * 899999); return `LRMS-2026-${n}`; }
export function paginate<T>(items: T[], page: number, pageSize: number) { const start = (page - 1) * pageSize; return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize }; }
export const DEMO_USERS: Record<string, { role: string; name: string }> = {
  'admin@lrms.demo': { role: 'SuperAdmin', name: 'Admin User' },
  'officer@lrms.demo': { role: 'CircleOfficer', name: 'Circle Officer Patna' },
  'citizen@lrms.demo': { role: 'Citizen', name: 'Demo Citizen' },
};
