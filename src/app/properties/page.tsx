// src/app/properties/page.tsx
import { PrismaClient } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AddPropertyDialog } from "@/components/property-actions"; // You imported it here...

const prisma = new PrismaClient();

export default async function PropertiesPage() {
  const properties = await prisma.property.findMany({
    include: {
      units: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Properties</h2>
        
        {/* FIX: Use the Component, not the Link */}
        <AddPropertyDialog />
        
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.length === 0 ? (
          <p className="text-muted-foreground col-span-full">
            No properties found. Add one to get started.
          </p>
        ) : (
          properties.map((property) => (
            <Card key={property.id}>
              <CardHeader>
                <CardTitle>{property.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{property.address}</p>
                <div className="mt-4 flex gap-4 text-sm font-medium">
                  <span>{property.units.length} Units</span>
                </div>
                <Button variant="outline" className="mt-4 w-full" asChild>
                  <Link href={`/properties/${property.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}