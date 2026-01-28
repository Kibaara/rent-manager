// src/app/tenants/[id]/page.tsx
import { PrismaClient } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Mail, Phone, Calendar, ArrowRight } from "lucide-react";

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

// Helper to format dates
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  }).format(date);
};

export default async function TenantProfilePage({ params }: PageProps) {
  const { id } = await params;

  // Fetch Tenant with FULL lease history
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id },
    include: {
      leases: {
        orderBy: { startDate: 'desc' }, // Newest first
        include: {
          unit: {
            include: { property: true }
          }
        }
      }
    }
  });

  const activeLease = tenant.leases.find(l => l.isActive);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* 1. PROFILE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{tenant.name}</h1>
          <p className="text-gray-500">Tenant Profile & History</p>
        </div>
        {activeLease && (
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
                <Link href={`/leases/${activeLease.id}`}>
                    Manage Current Financials <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 2. LEFT COLUMN: Personal Info */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-full">
                <Mail className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium">{tenant.email}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-full">
                <Phone className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium">{tenant.phone || "Not recorded"}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-full">
                <Calendar className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Tenant Since</p>
                <p className="text-sm font-medium">{formatDate(tenant.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. RIGHT COLUMN: Lease History */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Lease History</CardTitle>
            <CardDescription>A record of all units rented by this tenant.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property / Unit</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenant.leases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No leases found.
                    </TableCell>
                  </TableRow>
                ) : (
                  tenant.leases.map((lease) => (
                    <TableRow key={lease.id}>
                      <TableCell>
                        <div className="font-medium">{lease.unit.property.name}</div>
                        <div className="text-xs text-gray-500">Unit {lease.unit.unitNumber}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(lease.startDate)} - <br/>
                        {lease.endDate ? formatDate(lease.endDate) : "Ongoing"}
                      </TableCell>
                      <TableCell>
                        ${(lease.rentAmount / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {lease.isActive ? (
                          <Badge className="bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Expired</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/leases/${lease.id}`}>
                            View Ledger
                          </Link>
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
    </div>
  );
}