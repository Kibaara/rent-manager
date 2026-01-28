import { PrismaClient, ChargeType, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Seed...');

  // 1. CLEANUP (Delete old data so we don't get duplicates)
  // We delete in a specific order to avoid Foreign Key errors
  await prisma.paymentAllocation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.charge.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.property.deleteMany();
  await prisma.landlord.deleteMany();

  // 2. CREATE LANDLORD & PROPERTY
  const landlord = await prisma.landlord.create({
    data: {
      name: 'John Doe',
      email: 'john@rental.com',
    }
  });

  const property = await prisma.property.create({
    data: {
      name: 'Sunset Apartments',
      address: '123 Ocean Drive',
      landlordId: landlord.id,
    }
  });

  console.log('✅ Created Property: Sunset Apartments');

  // 3. CREATE UNITS
  const unit101 = await prisma.unit.create({
    data: { unitNumber: '101', propertyId: property.id }
  });
  const unit102 = await prisma.unit.create({
    data: { unitNumber: '102', propertyId: property.id }
  });

  // ==============================================
  // SCENARIO A: The Perfect Tenant (Alice)
  // Status: All paid up.
  // ==============================================
  const alice = await prisma.tenant.create({
    data: { name: 'Alice Smith', email: 'alice@example.com' }
  });

  const leaseAlice = await prisma.lease.create({
    data: {
      startDate: new Date('2025-01-01'),
      rentAmount: 100000, // $1,000.00
      unitId: unit101.id,
      tenantId: alice.id,
      isActive: true,
    }
  });

  // CHARGE: Jan Rent
  const chargeAliceJan = await prisma.charge.create({
    data: {
      leaseId: leaseAlice.id,
      amount: 100000,
      type: ChargeType.RENT,
      description: 'January Rent',
      dueDate: new Date('2025-01-01'),
    }
  });

  // PAYMENT: Jan Rent (Full)
  const paymentAliceJan = await prisma.payment.create({
    data: {
      leaseId: leaseAlice.id,
      amount: 100000,
      method: PaymentMethod.BANK_TRANSFER,
      dateReceived: new Date('2025-01-02'),
    }
  });

  // ALLOCATION: Connect them
  await prisma.paymentAllocation.create({
    data: {
      paymentId: paymentAliceJan.id,
      chargeId: chargeAliceJan.id,
      amount: 100000,
    }
  });

  console.log('✅ Created Scenario A: Alice (Perfect History)');


  // ==============================================
  // SCENARIO B: The Messy Tenant (Bob)
  // Status: Owes money, partial payments, late fees.
  // ==============================================
  const bob = await prisma.tenant.create({
    data: { name: 'Bob Jones', email: 'bob@example.com' }
  });

  const leaseBob = await prisma.lease.create({
    data: {
      startDate: new Date('2025-01-01'),
      rentAmount: 120000, // $1,200.00
      unitId: unit102.id,
      tenantId: bob.id,
      isActive: true,
    }
  });

  // 1. CHARGE: Jan Rent ($1,200)
  const chargeBobJan = await prisma.charge.create({
    data: {
      leaseId: leaseBob.id,
      amount: 120000,
      type: ChargeType.RENT,
      description: 'January Rent',
      dueDate: new Date('2025-01-01'),
    }
  });

  // 2. PAYMENT: Bob pays only $800 (Partial)
  const paymentBobJan = await prisma.payment.create({
    data: {
      leaseId: leaseBob.id,
      amount: 80000,
      method: PaymentMethod.CASH,
      dateReceived: new Date('2025-01-05'),
    }
  });

  // Allocate that $800 to the $1,200 charge
  await prisma.paymentAllocation.create({
    data: {
      paymentId: paymentBobJan.id,
      chargeId: chargeBobJan.id,
      amount: 80000,
    }
  });
  // Result: Jan Rent still has $400 due.

  // 3. CHARGE: Late Fee ($50)
  await prisma.charge.create({
    data: {
      leaseId: leaseBob.id,
      amount: 5000, // $50.00
      type: ChargeType.LATE_FEE,
      description: 'Jan Late Fee',
      dueDate: new Date('2025-01-06'),
    }
  });

  // 4. CHARGE: Feb Rent ($1,200) - Totally unpaid
  await prisma.charge.create({
    data: {
      leaseId: leaseBob.id,
      amount: 120000,
      type: ChargeType.RENT,
      description: 'February Rent',
      dueDate: new Date('2025-02-01'),
    }
  });

  console.log(`✅ Created Scenario B: Bob (Owes Money) - Lease ID: ${leaseBob.id}`);
  console.log('🌱 Seed Finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });