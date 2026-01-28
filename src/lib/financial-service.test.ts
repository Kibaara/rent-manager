// src/lib/financial-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { allocatePayment } from './financial-service';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'vitest-mock-extended';

// 1. SIMPLE MOCK
// Vitest sees this and looks for src/lib/__mocks__/db.ts automatically
vi.mock('./db'); 

// 2. Import the mocked client
import prisma from './db';

// 3. CAST TO MOCK TYPE
// We tell TypeScript: "Trust me, this is the Mock version, not the real one."
// This gives us access to .mockResolvedValue
const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('Financial Engine: Allocation Rules', () => {
  
  beforeEach(() => {
    // Clear history between tests so Scenario 1 doesn't affect Scenario 2
    vi.clearAllMocks();
  });

  // --- SCENARIO 1: The Happy Path ---
  it('should successfully allocate payment when funds and debt exist', async () => {
    const mockPayment = {
      id: 'pay-1',
      amount: 50000, 
      allocations: [] 
    };

    const mockCharge = {
      id: 'charge-1',
      amount: 100000, 
      allocations: [] 
    };

    // SETUP MOCKS
    prismaMock.payment.findUniqueOrThrow.mockResolvedValue(mockPayment as any);
    prismaMock.charge.findUniqueOrThrow.mockResolvedValue(mockCharge as any);
    
    // Important: The transaction mock must execute the callback immediately
    prismaMock.$transaction.mockImplementation((callback) => callback(prismaMock));

    // ACTION
    await allocatePayment('pay-1', 'charge-1', 50000);

    // ASSERTION
    expect(prismaMock.paymentAllocation.create).toHaveBeenCalledWith({
      data: {
        paymentId: 'pay-1',
        chargeId: 'charge-1',
        amount: 50000,
      },
    });
  });

  // --- SCENARIO 2: The "Double Spend" ---
  it('should FAIL if allocating more money than the payment has', async () => {
    const mockPayment = {
      id: 'pay-1',
      amount: 50000, 
      allocations: [
        { amount: 30000 } // $300 already used
      ]
    };

    const mockCharge = {
      id: 'charge-1',
      amount: 100000,
      allocations: []
    };

    prismaMock.payment.findUniqueOrThrow.mockResolvedValue(mockPayment as any);
    prismaMock.charge.findUniqueOrThrow.mockResolvedValue(mockCharge as any);
    prismaMock.$transaction.mockImplementation((callback) => callback(prismaMock));

    await expect(allocatePayment('pay-1', 'charge-1', 30000))
      .rejects
      .toThrow("Payment only has $200 remaining");
  });

  // --- SCENARIO 3: The "Overpayment" ---
  it('should FAIL if allocating more than the charge needs', async () => {
    const mockPayment = {
      id: 'pay-1',
      amount: 200000, 
      allocations: []
    };

    const mockCharge = {
      id: 'charge-1',
      amount: 10000, 
      allocations: [
        { amount: 5000 } // $50 already paid
      ]
    };

    prismaMock.payment.findUniqueOrThrow.mockResolvedValue(mockPayment as any);
    prismaMock.charge.findUniqueOrThrow.mockResolvedValue(mockCharge as any);
    prismaMock.$transaction.mockImplementation((callback) => callback(prismaMock));

    await expect(allocatePayment('pay-1', 'charge-1', 6000))
      .rejects
      .toThrow("Charge only needs $50 more");
  });
});