// src/app/leases/page.tsx
import { PrismaClient } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { DraftLeaseDialog } from "@/components/lease-create-dialog"; // Import new component

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  }).format(date);
};

export default async function LeasesListPage() {
  // 1. Fetch Leases (Existing Logic)
  const leases = await prisma.lease.findMany({
    include: {
      tenant: true,
      unit: { include: { property: true } }
    },
    orderBy: { isActive: 'desc' }
  });

  // 2. NEW: Fetch Data for the "Draft Lease" Wizard
  const [allTenants, allProperties] = await Promise.all([
    prisma.tenant.findMany({ orderBy: { name: 'asc' } }),
    prisma.property.findMany({
        include: {
            units: {
                include: {
                    leases: { where: { isActive: true } } // Fetch active leases to check occupancy
                },
                orderBy: { unitNumber: 'asc' }
            }
        },
        orderBy: { name: 'asc' }
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Leases</h2>
        
        {/* 3. NEW: Use the Dialog, passing data down */}
        <DraftLeaseDialog 
            tenants={allTenants} 
            properties={allProperties} 
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No active leases. Draft one to start tracking rent.
                  </TableCell>
                </TableRow>
              ) : (
                leases.map((lease) => (
                    <TableRow key={lease.id} className={!lease.isActive ? "opacity-60 bg-slate-50" : ""}>
                    <TableCell className="font-medium">
                        <Link href={`/tenants/${lease.tenantId}`} className="hover:underline">
                        {lease.tenant.name}
                        </Link>
                    </TableCell>
                    <TableCell>
                        {lease.unit.property.name} <span className="text-gray-400">/</span> Unit {lease.unit.unitNumber}
                    </TableCell>
                    <TableCell className="text-sm">
                        {formatDate(lease.startDate)} - {lease.endDate ? formatDate(lease.endDate) : "Ongoing"}
                    </TableCell>
                    <TableCell>
                        ${(lease.rentAmount / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                        {lease.isActive ? (
                        <Badge className="bg-green-600">Active</Badge>
                        ) : (
                        <Badge variant="secondary">Ended</Badge>
                        )}
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                        <Link href={`/leases/${lease.id}`}>View Ledger</Link>
                        </Button>
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}