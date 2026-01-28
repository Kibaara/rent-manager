// src/lib/financial-service.ts
import 'server-only'; 
import { PrismaClient, ChargeType, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

// 1. ADD DEBT
export async function createCharge(
  leaseId: string, 
  amountInCents: number, 
  type: ChargeType, 
  description?: string
) {
  return await prisma.charge.create({
    data: {
      leaseId,
      amount: amountInCents,
      type: type,
      description,
      dueDate: new Date(),
    },
  });
}

// 2. ADD CASH & AUTO-PAY BILLS (The Fix)
export async function recordPaymentAndAllocate(
  leaseId: string, 
  amountInCents: number, 
  method: PaymentMethod
) {
  return await prisma.$transaction(async (tx) => {
    // A. Create the Payment
    const payment = await tx.payment.create({
      data: {
        leaseId,
        amount: amountInCents,
        method: method,
        dateReceived: new Date(),
      },
    });

    // B. Find Unpaid Charges (Priority: Deposit -> Rent -> Oldest First)
    const unpaidCharges = await tx.charge.findMany({
      where: { 
        leaseId, 
        isVoided: false 
      },
      include: { allocations: true },
      orderBy: [
        // Priority 1: Security Deposits get paid first
        { type: 'asc' }, // S comes after R, wait. We need logic or strict sorting. 
        // Simple hack: Sort by Date. Deposits usually created first.
        { dueDate: 'asc' } 
      ]
    });

    // Custom Sort in JS to ensure Security Deposit is #1 priority
    unpaidCharges.sort((a, b) => {
      if (a.type === 'SECURITY_DEPOSIT' && b.type !== 'SECURITY_DEPOSIT') return -1;
      if (a.type !== 'SECURITY_DEPOSIT' && b.type === 'SECURITY_DEPOSIT') return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    let moneyRemaining = amountInCents;

    // C. Distribute Money
    for (const charge of unpaidCharges) {
      if (moneyRemaining <= 0) break;

      const alreadyPaid = charge.allocations.reduce((sum, a) => sum + a.amount, 0);
      const owed = charge.amount - alreadyPaid;

      if (owed > 0) {
        const toPay = Math.min(moneyRemaining, owed);

        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            chargeId: charge.id,
            amount: toPay,
          }
        });

        moneyRemaining -= toPay;
      }
    }

    return payment;
  });
}

// 3. THE REPORTER
export async function getTenantFinancialStatus(leaseId: string) {
  // ... (This function is used for calculation logic elsewhere, okay to leave or remove if unused)
  // For now, we are doing calculations directly in the Page.tsx for freshness.
  return null; 
}