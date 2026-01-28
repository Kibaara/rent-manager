// src/app/tenants/page.tsx
import { PrismaClient } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AddTenantDialog } from "@/components/tenant-actions";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function TenantsPage() {
  const tenants = await prisma.tenant.findMany({
    include: {
      leases: {
        where: { isActive: true },
        include: { unit: { include: { property: true } } }
      }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tenants</h2>
        <AddTenantDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Current Unit</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No tenants found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => {
                  const activeLease = tenant.leases[0];
                  
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">
                        <Link href={`/tenants/${tenant.id}`} className="hover:underline">
                          {tenant.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{tenant.email}</div>
                        <div className="text-xs text-gray-500">{tenant.phone}</div>
                      </TableCell>
                      <TableCell>
                        {activeLease ? (
                          <div className="flex flex-col">
                            <span className="font-medium">Unit {activeLease.unit.unitNumber}</span>
                            <span className="text-xs text-gray-500">{activeLease.unit.property.name}</span>
                          </div>
                        ) : (
                            <Badge variant="secondary">No Active Lease</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/tenants/${tenant.id}`}>View Profile</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}