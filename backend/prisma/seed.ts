import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// LRMS demo seed — fictional data only. Independent demo, NOT an official
// Bihar Government system. Run with: npm run seed  (needs DATABASE_URL).
// Demo credentials are documented ONLY in docs/DEMO_ACCOUNTS.md; passwords
// are bcrypt-hashed here at seed time, never stored in plaintext.
const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Demo@123';

// Deterministic pseudo-random so seed output is stable across runs.
let seedState = 42;
function rnd() { seedState = (seedState * 1103515245 + 12345) % 2147483648; return seedState / 2147483648; }
function rndInt(min: number, max: number) { return Math.floor(rnd() * (max - min + 1)) + min; }

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) { console.log('Seed skipped: users already exist.'); return; }

  for (const name of ['SuperAdmin', 'DistrictOfficer', 'CircleOfficer', 'RevenueEmployee', 'Amin', 'Citizen'])
    await prisma.role.create({ data: { name, description: `LRMS role ${name}` } });
  for (const name of ['land:read', 'land:write', 'mutation:approve', 'mutation:review', 'revenue:manage', 'survey:manage', 'certificate:issue', 'complaint:manage', 'user:manage', 'report:export'])
    await prisma.permission.create({ data: { name } });

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const admin = await prisma.user.create({ data: { fullName: 'Demo Super Admin', mobile: '9000000001', email: 'admin@lrms.demo', passwordHash: hash, role: 'SuperAdmin', otpVerified: true, address: 'Patna, Bihar' } });
  const officer = await prisma.user.create({ data: { fullName: 'Demo Circle Officer', mobile: '9000000002', email: 'officer@lrms.demo', passwordHash: hash, role: 'CircleOfficer', otpVerified: true, district: 'Patna', circle: 'Patna Sadar', address: 'Patna Sadar, Patna' } });
  const employee = await prisma.user.create({ data: { fullName: 'Demo Revenue Employee', mobile: '9000000003', email: 'employee@lrms.demo', passwordHash: hash, role: 'RevenueEmployee', otpVerified: true, district: 'Patna', circle: 'Patna Sadar' } });
  const amin = await prisma.user.create({ data: { fullName: 'Demo Amin', mobile: '9000000004', email: 'amin@lrms.demo', passwordHash: hash, role: 'Amin', otpVerified: true, district: 'Patna', circle: 'Danapur' } });
  const citizen = await prisma.user.create({ data: { fullName: 'Demo Citizen', mobile: '9000000005', email: 'citizen@lrms.demo', passwordHash: hash, role: 'Citizen', otpVerified: true, district: 'Patna', circle: 'Patna Sadar', address: 'Rajendra Nagar, Patna' } });
  await prisma.user.create({ data: { fullName: 'Demo District Officer', mobile: '9000000006', email: 'district@lrms.demo', passwordHash: hash, role: 'DistrictOfficer', otpVerified: true, district: 'Gaya' } });

  const patna = await prisma.district.create({ data: { name: 'Patna', code: 'PAT' } });
  const gaya = await prisma.district.create({ data: { name: 'Gaya', code: 'GAY' } });
  const muzaffarpur = await prisma.district.create({ data: { name: 'Muzaffarpur', code: 'MUZ' } });

  const circleDefs = [
    { name: 'Patna Sadar', districtId: patna.id }, { name: 'Danapur', districtId: patna.id }, { name: 'Phulwari Sharif', districtId: patna.id },
    { name: 'Gaya Sadar', districtId: gaya.id }, { name: 'Bodh Gaya', districtId: gaya.id },
    { name: 'Muzaffarpur Sadar', districtId: muzaffarpur.id }, { name: 'Motihari Road', districtId: muzaffarpur.id },
  ];
  const circles = [];
  for (const c of circleDefs) circles.push(await prisma.circle.create({ data: c }));
  const mauzas = [];
  for (const c of circles) {
    mauzas.push(await prisma.mauza.create({ data: { name: `${c.name} Mauza A`, circleId: c.id } }));
    mauzas.push(await prisma.mauza.create({ data: { name: `${c.name} Mauza B`, circleId: c.id } }));
  }
  const villages = [];
  for (const m of mauzas) villages.push(await prisma.village.create({ data: { name: `${m.name} Village`, mauzaId: m.id } }));

  const first = ['Ramesh', 'Suresh', 'Anita', 'Vikash', 'Pooja', 'Manoj', 'Sunita', 'Rajesh', 'Kavita', 'Amit', 'Neha', 'Sanjay', 'Rekha', 'Deepak', 'Meera', 'Arjun', 'Priya', 'Nitin', 'Shalini', 'Kiran', 'Rahul', 'Divya', 'Mohit', 'Geeta'];
  const last = ['Kumar', 'Singh', 'Sharma', 'Verma', 'Yadav', 'Gupta', 'Mishra', 'Jha', 'Pandey', 'Tiwari'];
  const classes = ['Agricultural', 'Residential', 'Commercial', 'Homestead', 'Agricultural', 'Residential'];
  const owners = [];
  for (let i = 0; i < 24; i++) {
    owners.push(await prisma.landOwner.create({ data: { fullName: `${first[i]} ${last[i % last.length]}`, fatherName: `Father of ${first[i]}`, mobile: `98${rndInt(10000000, 99999999)}`, address: `Demo address ${i + 1}, Bihar`, userId: i === 0 ? citizen.id : undefined } }));
  }
  const records = [];
  for (let i = 0; i < 24; i++) {
    const c = circles[i % circles.length];
    const d = c.districtId === patna.id ? 'Patna' : c.districtId === gaya.id ? 'Gaya' : 'Muzaffarpur';
    const area = Math.round((rnd() * 90 + 10) * 100) / 100;
    const rec = await prisma.landRecord.create({ data: { khataNumber: `KH-${100 + i}`, khesraNumber: `KHE-${500 + i}`, plotNumber: `PL-${1000 + i}`, mauza: mauzas[(i * 2) % mauzas.length].name, village: villages[(i * 2) % villages.length].name, circle: c.name, district: d, areaInDecimal: area, landClassification: classes[i % classes.length], ownerId: owners[i].id, ownerUserId: i === 0 ? citizen.id : undefined, status: 'Active', latitude: 25.6 + rnd() * 0.4, longitude: 85.1 + rnd() * 0.4 } });
    records.push(rec);
    await prisma.jamabandiRecord.create({ data: { landRecordId: rec.id, jamabandiNumber: `JB-${String(rec.id).padStart(3, '0')}`, ownerName: owners[i].fullName, khataNumber: rec.khataNumber, khesraNumber: rec.khesraNumber, areaInDecimal: area, classification: rec.landClassification, isCurrent: true } });
    await prisma.landOwnershipHistory.create({ data: { landRecordId: rec.id, toOwnerId: rec.ownerId, fromOwnerName: 'Previous owner (demo)', toOwnerName: owners[i].fullName, transferType: 'Initial', transferDate: new Date(Date.now() - 2 * 365 * 86400000) } });
  }

  const mStats = ['Pending', 'UnderReview', 'Approved', 'Rejected', 'Pending', 'UnderReview'];
  for (let i = 0; i < 18; i++) {
    await prisma.mutationApplication.create({ data: { trackingNumber: `LRMS-MUT-2026${String(i).padStart(3, '0')}`, landRecordId: records[i % records.length].id, applicantUserId: i % 3 === 0 ? citizen.id : officer.id, sellerName: owners[i % owners.length].fullName, buyerName: `${first[(i + 5) % first.length]} ${last[(i + 3) % last.length]}`, sellerMobile: '9800000000', buyerMobile: '9811111111', mutationType: i % 3 === 0 ? 'Sale' : i % 3 === 1 ? 'Inheritance' : 'Gift', status: mStats[i % mStats.length], assignedToUserId: i % 2 === 0 ? employee.id : officer.id, remarks: i % 4 === 0 ? 'Documents under verification (demo).' : undefined, createdAt: new Date(Date.now() - (i * 4 + 2) * 86400000) } });
  }

  for (const d of ['Patna', 'Gaya', 'Muzaffarpur'])
    for (const [cls, rate] of [['Agricultural', 120], ['Residential', 450], ['Commercial', 900], ['Homestead', 300]] as const)
      await prisma.revenueRate.create({ data: { district: d, landClassification: cls, ratePerDecimal: rate, isActive: true } });
  for (let i = 0; i < 24; i++) {
    const paid = i % 3 !== 0;
    await prisma.revenuePayment.create({ data: { landRecordId: records[i].id, userId: citizen.id, amount: Math.round(Number(records[i].areaInDecimal) * 120 * 100) / 100, financialYear: '2026-27', status: paid ? 'Paid' : 'Unpaid', paymentMethod: paid ? 'Razorpay-Test' : undefined, transactionId: paid ? `TXN-DEMO-${1000 + i}` : undefined, receiptNumber: paid ? `LRMS-RCT-2026-${100000 + i}` : undefined, paidAt: paid ? new Date(Date.now() - (i * 3 + 1) * 86400000) : undefined, createdAt: new Date(Date.now() - (i * 3 + 5) * 86400000) } });
  }

  for (let i = 0; i < 6; i++) {
    const sr = await prisma.surveyRequest.create({ data: { landRecordId: records[i].id, requestedByUserId: citizen.id, surveyType: i % 2 === 0 ? 'Measurement' : 'Demarcation', status: i < 2 ? 'Pending' : i < 4 ? 'Assigned' : 'Completed', preferredDate: new Date(Date.now() + (7 + i) * 86400000) } });
    if (i >= 2) {
      await prisma.surveyAssignment.create({ data: { surveyRequestId: sr.id, aminUserId: amin.id, appointmentDate: new Date(Date.now() + (3 + i) * 86400000), status: i < 4 ? 'Assigned' : 'Completed' } });
      if (i >= 4) await prisma.surveyReport.create({ data: { surveyRequestId: sr.id, measuredArea: records[i].areaInDecimal, surveyorNotes: 'Measured on site (demo).' } });
    }
  }
  for (let i = 0; i < 5; i++) {
    const ca = await prisma.certificateApplication.create({ data: { userId: citizen.id, landRecordId: records[i].id, certificateType: 'LPC', status: i === 0 ? 'Pending' : i === 1 ? 'UnderReview' : i === 2 ? 'Approved' : 'Rejected', purpose: 'Loan / official use (demo)' } });
    if (i === 2) await prisma.certificate.create({ data: { certificateApplicationId: ca.id, referenceNumber: `LRMS-2026-10000${i}`, issuedTo: citizen.fullName, landRecordId: records[i].id, issuedByUserId: officer.id, validUntil: new Date(Date.now() + 365 * 86400000) } });
  }
  for (let i = 0; i < 5; i++) {
    const comp = await prisma.complaint.create({ data: { userId: citizen.id, landRecordId: records[i].id, title: `Demo complaint ${i + 1}: boundary issue`, description: 'Fictional demo complaint for testing.', category: i % 2 === 0 ? 'Boundary' : 'Record Error', status: i === 0 ? 'Pending' : i === 1 ? 'InProgress' : 'Resolved', assignedToUserId: employee.id } });
    await prisma.complaintRemark.create({ data: { complaintId: comp.id, remark: 'Complaint received (demo).', authorUserId: employee.id, authorRole: 'RevenueEmployee' } });
  }
  for (let i = 0; i < 3; i++)
    await prisma.landDispute.create({ data: { landRecordId: records[10 + i].id, title: `Demo dispute ${i + 1}`, description: 'Fictional demo dispute.', status: 'InProgress', parties: 'Party A vs Party B (demo)', assignedToUserId: officer.id } });

  await prisma.notification.createMany({ data: [
    { userId: citizen.id, title: 'Welcome to LRMS demo', message: 'Your demo citizen account is ready.', type: 'Info' },
    { userId: citizen.id, title: 'Mutation received', message: 'Your mutation application LRMS-MUT-2026000 is under review.', type: 'Mutation', relatedEntity: 'Mutation', relatedId: 1 },
    { userId: officer.id, title: 'New mutation assigned', message: 'A mutation application awaits your review.', type: 'Mutation' },
  ] });
  console.log('Seed complete: 3 districts, 24 land records, 18 mutations, demo users created.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
