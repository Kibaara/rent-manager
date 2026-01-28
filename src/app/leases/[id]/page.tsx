// src/app/leases/[id]/page.tsx
import { PrismaClient } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

// Imports for our Dialogs
import { AddChargeDialog } from "@/components/lease-charge-dialog";
import { AddPaymentDialog } from "@/components/lease-payment-dialog";
import { TerminateLeaseDialog } from "@/components/lease-terminate-dialog";

const prisma = new PrismaClient();

const formatMoney = (cents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  }).format(date);
};

type PageProps = {
  params: Promise<{ id: string }>;
};

// --- MAIN COMPONENT ---
export default async function LeaseDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Fetch Data
  const lease = await prisma.lease.findUnique({
    where: { id },
    include: {
      tenant: true,
      unit: { include: { property: true } },
      charges: { include: { allocations: true }, orderBy: { dueDate: 'desc' } },
      payments: { include: { allocations: true }, orderBy: { dateReceived: 'desc' } }
    }
  });

  if (!lease) {
    notFound();
  }

  // 2. Calculate Financials
  const totalCharged = lease.charges.filter(c => !c.isVoided).reduce((sum, c) => sum + c.amount, 0);
  const totalPaid = lease.payments.filter(p => !p.isRefunded).reduce((sum, p) => sum + p.amount, 0);
  const balance = totalCharged - totalPaid;

  // Calculate Held Security Deposit
  const securityDepositCharges = lease.charges.filter(c => c.type === 'SECURITY_DEPOSIT' && !c.isVoided);
  const heldDeposit = securityDepositCharges.reduce((sum, charge) => {
      const paidOnThisCharge = charge.allocations.reduce((aSum, alloc) => aSum + alloc.amount, 0);
      return sum + paidOnThisCharge;
  }, 0);
  
  const totalDepositRequired = securityDepositCharges.reduce((sum, c) => sum + c.amount, 0);

  // Build Timeline
  const timeline = [
    ...lease.charges.map(c => ({
      ...c,
      kind: 'CHARGE',
      date: c.dueDate,
      remainingDue: c.amount - c.allocations.reduce((sum, a) => sum + a.amount, 0)
    })),
    ...lease.payments.map(p => ({
      ...p,
      kind: 'PAYMENT',
      date: p.dateReceived,
      unallocatedAmount: p.amount - p.allocations.reduce((sum, a) => sum + a.amount, 0)
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // 3. Render UI (This is the critical part that must return JSX)
  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">Lease Details</h2>
            <Badge className={lease.isActive ? "bg-green-600" : "bg-gray-500"}>
              {lease.isActive ? "Active" : "Ended"}
            </Badge>
          </div>
          <p className="text-gray-500">
            {lease.tenant.name} &bull; {lease.unit.property.name} Unit {lease.unit.unitNumber}
          </p>
        </div>

        <div className="flex items-center gap-2">
            {/* Only show actions if active */}
            {lease.isActive && (
                <>
                    <AddChargeDialog leaseId={lease.id} />
                    <AddPaymentDialog leaseId={lease.id} />
                    <TerminateLeaseDialog leaseId={lease.id} currentDeposit={heldDeposit} />
                </>
            )}
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid gap-4 md:grid-cols-3">
        
        {/* Balance Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
              {formatMoney(balance)}
            </div>
            <p className="text-xs text-gray-500">
              {balance > 0 ? "Tenant owes money" : "All bills paid"}
            </p>
          </CardContent>
        </Card>

        {/* Security Deposit Card */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Security Deposit Held</CardTitle>
            <ShieldCheck className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatMoney(heldDeposit)}
            </div>
            <p className="text-xs text-gray-500">
              Target: {formatMoney(totalDepositRequired)}
            </p>
            {heldDeposit < totalDepositRequired && (
                <span className="text-xs text-red-500 font-medium">Partially Unpaid</span>
            )}
          </CardContent>
        </Card>
      
      </div>

      {/* LEDGER TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeline.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No activity yet.</div>
            ) : (
              timeline.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-500 font-mono">
                      {formatDate(item.date)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {item.kind === 'CHARGE' ? (item.description || item.type) : `Payment via ${item.method}`}
                        {item.isVoided && <span className="ml-2 text-red-500 text-xs">(VOIDED)</span>}
                        {item.isRefunded && <span className="ml-2 text-red-500 text-xs">(REFUNDED)</span>}
                      </p>
                      
                      <div className="text-xs text-gray-500 flex gap-2">
                        {item.kind === 'CHARGE' ? (
                          !item.isVoided && (
                            <span className={item.remainingDue === 0 ? "text-green-600" : "text-red-500"}>
                                {item.remainingDue === 0 ? "PAID IN FULL" : `Unpaid: ${formatMoney(item.remainingDue)}`}
                            </span>
                          )
                        ) : (
                          !item.isRefunded && (
                             <span className={item.unallocatedAmount > 0 ? "text-orange-600" : "text-gray-500"}>
                                {item.unallocatedAmount > 0 ? `Unallocated Credit: ${formatMoney(item.unallocatedAmount)}` : "Fully Applied"}
                             </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Invoice Download Button (Stub) */}
                    {item.kind === 'PAYMENT' && !item.isRefunded && (
                      <Button variant="ghost" size="icon" asChild title="Download Receipt">
                         <span className="cursor-pointer"><Download className="h-4 w-4 text-gray-400" /></span>
                      </Button>
                    )}
                    <div className={`text-lg font-bold ${item.kind === 'PAYMENT' ? 'text-green-600' : 'text-gray-900'} ${item.isVoided || item.isRefunded ? 'line-through opacity-50' : ''}`}>
                      {item.kind === 'CHARGE' ? '-' : '+'}{formatMoney(item.amount)}
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}