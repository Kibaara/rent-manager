// src/app/properties/[id]/page.tsx
import { PrismaClient } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation"; // <--- ADD THIS IMPORT
import { AddUnitDialog } from "@/components/unit-actions";
const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;

  // FIX: Use findUnique instead of findUniqueOrThrow
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      units: {
        orderBy: { unitNumber: 'asc' },
        include: {
          leases: {
            where: { isActive: true },
            include: { tenant: true }
          }
        }
      }
    }
  });

  // FIX: Handle the "Not Found" case gracefully
  if (!property) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{property.name}</h2>
          <p className="text-gray-500">{property.address}</p>
        </div>
        <AddUnitDialog propertyId={property.id} />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Rent</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {property.units.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                   No units found in this property.
                 </TableCell>
               </TableRow>
            ) : (
              property.units.map((unit) => {
                const activeLease = unit.leases[0]; 
                
                return (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                    <TableCell>
                      {activeLease ? (
                        <Badge variant="default" className="bg-green-600">Occupied</Badge>
                      ) : (
                        <Badge variant="secondary">Vacant</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {activeLease ? (
                        <Link href={`/tenants/${activeLease.tenant.id}`} className="hover:underline">
                          {activeLease.tenant.name}
                        </Link>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {activeLease 
                        ? `$${(activeLease.rentAmount / 100).toFixed(2)}` 
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/units/${unit.id}`}>Manage</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}