// src/lib/dashboard-analytics.ts
import { PrismaClient, ChargeType } from '@prisma/client';

const prisma = new PrismaClient();

export type DashboardMetrics = {
  financials: {
    totalArrears: number;      // Money tenants owe us (Assets)
    totalDeposits: number;     // Money we hold for tenants (Liabilities)
    monthlyRevenue: number;    // Cash collected this month
  };
  propertyPerformance: {
    propertyId: string;
    name: string;
    revenue: number;           // Revenue all-time (or YTD)
    occupancyRate: number;
  }[];
  riskWatchlist: {
    tenantName: string;
    unit: string;
    totalOwed: number;
    lastPaymentDate: Date | null;
  }[];
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // 1. PARALLEL QUERIES
  // We use Promise.all to fetch distinct datasets simultaneously
  const [
    rawCharges,
    rawPaymentsThisMonth,
    properties,
    tenantsWithLeases
  ] = await Promise.all([
    
    // A. Fetch ALL non-voided charges with their allocations
    // We need this to calculate Arrears vs Deposits
    prisma.charge.findMany({
      where: { isVoided: false },
      include: { allocations: true, lease: true }
    }),

    // B. Fetch Payments just for THIS month (Cash Flow)
    prisma.payment.aggregate({
      where: {
        dateReceived: { gte: firstDayOfMonth, lt: nextMonth }
      },
      _sum: { amount: true }
    }),

    // C. Properties for performance grouping
    prisma.property.findMany({
      include: { 
        units: { 
          include: { leases: { where: { isActive: true } } } 
        } 
      }
    }),

    // D. Tenants for Risk Analysis
    prisma.tenant.findMany({
      include: {
        leases: {
          where: { isActive: true },
          include: { 
            charges: { include: { allocations: true } },
            payments: { orderBy: { dateReceived: 'desc' }, take: 1 } // Last payment
          }
        }
      }
    })
  ]);

  // 2. DERIVE FINANCIALS
  let totalArrears = 0;
  let totalDeposits = 0;

  rawCharges.forEach(charge => {
    const paidAmount = charge.allocations.reduce((sum, a) => sum + a.amount, 0);
    const balance = charge.amount - paidAmount;

    if (charge.type === 'SECURITY_DEPOSIT') {
      // If it's a deposit, the AMOUNT PAID is our Liability (what we hold)
      totalDeposits += paidAmount;
    } else {
      // For Rent/Water, the BALANCE is the Arrears (what they owe)
      if (balance > 0) {
        totalArrears += balance;
      }
    }
  });

  // 3. DERIVE PROPERTY PERFORMANCE
  // Note: Real-world apps might calculate revenue via PaymentAllocations linked to Property.
  // Here we estimate based on Unit counts for simplicity of the example.
  const propertyPerformance = properties.map(prop => {
    const totalUnits = prop.units.length;
    const occupiedUnits = prop.units.filter(u => u.leases.length > 0).length;
    
    return {
      propertyId: prop.id,
      name: prop.name,
      revenue: 0, // In a full implementation, we'd sum payments per property
      occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0
    };
  });

  // 4. DERIVE RISK WATCHLIST (Tenants owing > $100)
  const riskWatchlist = tenantsWithLeases
    .map(t => {
      const activeLease = t.leases[0];
      if (!activeLease) return null;

      // Calculate debt for this specific tenant
      const debt = activeLease.charges.reduce((acc, charge) => {
        const paid = charge.allocations.reduce((sum, a) => sum + a.amount, 0);
        // Only count Rent/Utilities as "Risk" debt, not unpaid deposits
        if (charge.type !== 'SECURITY_DEPOSIT') {
          return acc + (charge.amount - paid);
        }
        return acc;
      }, 0);

      return {
        tenantName: t.name,
        unit: "", // We would fetch unit number here if needed
        totalOwed: debt,
        lastPaymentDate: activeLease.payments[0]?.dateReceived || null
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null && item.totalOwed > 10000) // Only show if owe > $100
    .sort((a, b) => b.totalOwed - a.totalOwed); // Highest debt first

  return {
    financials: {
      totalArrears,
      totalDeposits,
      monthlyRevenue: rawPaymentsThisMonth._sum.amount || 0
    },
    propertyPerformance,
    riskWatchlist
  };
}