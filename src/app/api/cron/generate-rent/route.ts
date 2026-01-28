// src/app/api/cron/generate-rent/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, ChargeType } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // 1. Security Check (Prevent random people from triggering this)
  // In Vercel Cron, this header is automatically added.
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Find all ACTIVE Leases
  const activeLeases = await prisma.lease.findMany({
    where: { isActive: true },
    include: { tenant: true } // just for logging
  });

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  let createdCount = 0;

  // 3. Loop and Create Charges
  for (const lease of activeLeases) {
    // Check if we ALREADY charged rent this month (Prevent Duplicates)
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
          dueDate: currentMonthStart, // Due on the 1st
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