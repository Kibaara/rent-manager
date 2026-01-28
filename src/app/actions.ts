// src/app/actions.ts
'use server'

import { revalidatePath } from 'next/cache';
import { createCharge, recordPaymentAndAllocate } from '@/lib/financial-service';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// --- VALIDATION SCHEMAS ---

const ChargeSchema = z.object({
  leaseId: z.string().uuid(),
  amount: z.number().positive(),
  // UPDATED: Added DAMAGE_FEE
  type: z.enum(['RENT', 'SECURITY_DEPOSIT', 'WATER', 'GARBAGE', 'DAMAGE_FEE']), 
  description: z.string().optional(),
});

const PaymentSchema = z.object({
  leaseId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY']),
});

const PropertySchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
});

const UnitSchema = z.object({
  propertyId: z.string().uuid(),
  unitNumber: z.string().min(1, "Unit Number is required"),
  monthlyRent: z.number().min(0),
});

const TenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

const LeaseSchema = z.object({
  tenantId: z.string().uuid(),
  unitId: z.string().uuid(),
  startDate: z.string().transform((str) => new Date(str)),
  rentAmount: z.number().positive(),
  securityDeposit: z.number().min(0).optional(),
});

// --- ACTIONS ---

export async function addCharge(leaseId: string, amount: number, type: any, description: string) {
  const result = ChargeSchema.safeParse({ leaseId, amount, type, description });
  if (!result.success) throw new Error("Invalid charge data");
  
  await createCharge(result.data.leaseId, result.data.amount, result.data.type, result.data.description || "Manual Charge");
  
  revalidatePath(`/leases/${leaseId}`);
}

export async function addPayment(leaseId: string, amount: number, method: any) {
  const result = PaymentSchema.safeParse({ leaseId, amount, method });
  if (!result.success) throw new Error("Invalid payment data");
  
  await recordPaymentAndAllocate(result.data.leaseId, result.data.amount, result.data.method);
  
  revalidatePath(`/leases/${leaseId}`);
}

export async function voidCharge(chargeId: string, leaseId: string) {
  await prisma.charge.update({ where: { id: chargeId }, data: { isVoided: true } });
  await prisma.paymentAllocation.deleteMany({ where: { chargeId } });
  revalidatePath(`/leases/${leaseId}`);
}

export async function refundPayment(paymentId: string, leaseId: string) {
  await prisma.payment.update({ where: { id: paymentId }, data: { isRefunded: true } });
  await prisma.paymentAllocation.deleteMany({ where: { paymentId } });
  revalidatePath(`/leases/${leaseId}`);
}

export async function createProperty(name: string, address: string) {
  const result = PropertySchema.safeParse({ name, address });
  if (!result.success) throw new Error("Invalid property data");
  const landlord = await prisma.landlord.findFirst();
  if (!landlord) throw new Error("No landlord account found.");
  await prisma.property.create({
    data: { name: result.data.name, address: result.data.address, landlordId: landlord.id }
  });
  revalidatePath('/properties');
  revalidatePath('/dashboard');
}

export async function createUnit(propertyId: string, unitNumber: string, monthlyRent: number) {
  const result = UnitSchema.safeParse({ propertyId, unitNumber, monthlyRent });
  if (!result.success) throw new Error("Invalid unit data");
  await prisma.unit.create({
    data: { propertyId: result.data.propertyId, unitNumber: result.data.unitNumber, monthlyRent: result.data.monthlyRent }
  });
  revalidatePath(`/properties/${propertyId}`);
}

export async function createTenant(name: string, email: string, phone?: string) {
  const result = TenantSchema.safeParse({ name, email, phone });
  if (!result.success) throw new Error("Invalid tenant data");
  try {
    await prisma.tenant.create({
      data: { name: result.data.name, email: result.data.email, phone: result.data.phone || null }
    });
  } catch (e: any) {
    if (e.code === 'P2002') throw new Error("A tenant with this email already exists.");
    throw e;
  }
  revalidatePath('/tenants');
}

export async function createLease(
  tenantId: string, 
  unitId: string, 
  startDateRaw: string, 
  rentAmount: number,
  securityDeposit: number 
) {
  const result = LeaseSchema.safeParse({ 
    tenantId, 
    unitId, 
    startDate: startDateRaw, 
    rentAmount,
    securityDeposit 
  });
  
  if (!result.success) throw new Error("Invalid lease data");

  const existingLease = await prisma.lease.findFirst({
    where: { unitId: result.data.unitId, isActive: true }
  });
  if (existingLease) {
    throw new Error("This unit is already occupied by another active lease.");
  }

  // 1. Create Lease
  const newLease = await prisma.lease.create({
    data: {
      tenantId: result.data.tenantId,
      unitId: result.data.unitId,
      startDate: result.data.startDate,
      rentAmount: result.data.rentAmount,
      isActive: true,
    }
  });

  // 2. Auto-Charge First Month's Rent
  await createCharge(
    newLease.id, 
    result.data.rentAmount, 
    'RENT', 
    'First Month Rent'
  );

  // 3. Auto-Charge Security Deposit
  if (result.data.securityDeposit && result.data.securityDeposit > 0) {
    await createCharge(
      newLease.id, 
      result.data.securityDeposit, 
      'SECURITY_DEPOSIT', 
      'Security Deposit'
    );
  }

  revalidatePath('/leases');
  revalidatePath('/dashboard');
}

// NEW: End Lease Action
export async function endLease(
  leaseId: string, 
  moveOutDate: string, 
  deductionAmount: number, 
  deductionDescription: string
) {
  if (deductionAmount < 0) throw new Error("Deductions cannot be negative");

  // 1. Create Deduction Charge (if any)
  if (deductionAmount > 0) {
    await createCharge(
        leaseId, 
        deductionAmount, 
        'DAMAGE_FEE', 
        deductionDescription || 'Move-out Deductions'
    );
  }

  // 2. Terminate Lease
  await prisma.lease.update({
    where: { id: leaseId },
    data: {
      isActive: false,
      endDate: new Date(moveOutDate),
    }
  });

  revalidatePath(`/leases/${leaseId}`);
  revalidatePath('/dashboard');
}