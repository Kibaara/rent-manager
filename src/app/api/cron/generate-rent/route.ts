// src/app/api/cron/generate-rent/route.ts
import { NextResponse } from 'next/server';
import { ChargeType } from '@prisma/client';
import prisma from '@/lib/db'; // Use the shared DB client

// FIX: This line prevents the "Failed to collect page data" build error
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Find all ACTIVE Leases
  const activeLeases = await prisma.lease.findMany({
    where: { isActive: true },
    include: { tenant: true }
  });

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  let createdCount = 0;

  // 3. Loop and Create Charges
  for (const lease of activeLeases) {
    const existingCharge = await prisma.charge.findFirst({
      where: {
        leaseId: lease.id,
        type: ChargeType.RENT,
        dueDate: {
          gte: currentMonthStart,
          lt: nextMonthStart
        }
      }
    });

    if (!existingCharge) {
      await prisma.charge.create({
        data: {
          leaseId: lease.id,
          amount: lease.rentAmount,
          type: ChargeType.RENT,
          description: `Rent - ${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`,
          dueDate: currentMonthStart,
        }
      });
      createdCount++;
    }
  }

  return NextResponse.json({ 
    success: true, 
    message: `Generated ${createdCount} rent charges for ${activeLeases.length} active leases.` 
  });
}