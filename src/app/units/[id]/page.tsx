// src/app/units/[id]/page.tsx
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { ArrowLeft, Building } from "lucide-react";

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

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

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Fetch the UNIT (Correct entity!)
  const unit = await prisma.unit.findUnique({
    where: { id },
    include: {
      property: true,
      leases: {
        orderBy: { startDate: 'desc' }, // Show newest history first
        include: { tenant: true }
      }
    }
  });

  if (!unit) {
    return notFound();
  }

  const activeLease = unit.leases.find(l => l.isActive);

  return (
    <div className="space-y-6">
      
      {/* Header & Navigation */}
      <div className="flex flex-col gap-4">
         <Button variant="ghost" className="w-fit pl-0 hover:bg-transparent hover:text-gray-600" asChild>
            <Link href={`/properties/${unit.propertyId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Property
            </Link>
         </Button>

         <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Unit {unit.unitNumber}</h2>
                <div className="flex items-center gap-2 text-gray-500">
                    <Building className="h-4 w-4" />
                    <span>{unit.property.name}</span>
                </div>
            </div>
            <Badge className={activeLease ? "bg-green-600" : "bg-gray-500"}>
                {activeLease ? "Occupied" : "Vacant"}
            </Badge>
         </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Unit Details Card */}
        <Card>
            <CardHeader>
                <CardTitle>Unit Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Target Rent</span>
                    <span className="font-medium">{formatMoney(unit.monthlyRent)}/mo</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Current Status</span>
                    <span className="font-medium">{activeLease ? "Leased" : "Available"}</span>
                </div>
                {activeLease && (
                    <div className="pt-4">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                            <Link href={`/leases/${activeLease.id}`}>View Current Lease</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* History Card */}
        <Card>
            <CardHeader>
                <CardTitle>Lease History</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tenant</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {unit.leases.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-gray-500 py-4">
                                    No history found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            unit.leases.map(lease => (
                                <TableRow key={lease.id}>
                                    <TableCell>
                                        <Link href={`/tenants/${lease.tenantId}`} className="hover:underline text-blue-600">
                                            {lease.tenant.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {formatDate(lease.startDate)} - {lease.endDate ? formatDate(lease.endDate) : "Present"}
                                    </TableCell>
                                    <TableCell>
                                        {lease.isActive ? <Badge className="bg-green-600">Active</Badge> : <Badge variant="outline">Ended</Badge>}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}