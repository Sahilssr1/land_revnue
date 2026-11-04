# LRMS Demo Accounts (fictional demo data only)

> Independent demo — NOT an official Bihar Government system. Change or
> disable these accounts before any non-local deployment.

| Email | Password | Role |
|---|---|---|
| admin@lrms.demo | Demo@123 | SuperAdmin |
| district@lrms.demo | Demo@123 | DistrictOfficer |
| officer@lrms.demo | Demo@123 | CircleOfficer |
| employee@lrms.demo | Demo@123 | RevenueEmployee |
| amin@lrms.demo | Demo@123 | Amin |
| citizen@lrms.demo | Demo@123 | Citizen |

Passwords are BCrypt-hashed at seed time (`backend/Data/SeedData.cs`);
only hashes are stored in the database. OTP verification in this demo is
mocked: any 6-digit code verifies. Never use the mock OTP or these
accounts in production.
