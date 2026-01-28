'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createUnit } from '@/app/actions';
import { Plus } from "lucide-react";

export function AddUnitDialog({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAction(formData: FormData) {
    setLoading(true);
    const unitNumber = formData.get('unitNumber') as string;
    
    // Parse rent safely (convert string to float to cents)
    const rawRent = formData.get('monthlyRent') as string;
    const monthlyRentCents = Math.round(parseFloat(rawRent || "0") * 100);

    try {
        await createUnit(propertyId, unitNumber, monthlyRentCents);
        setOpen(false);
    } catch (error) {
        alert("Failed to add unit. It might already exist.");
        console.error(error);
    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Add Unit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Unit</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unitNumber">Unit Number</Label>
            <Input id="unitNumber" name="unitNumber" required placeholder="e.g. 101, 2B, Penthouse" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyRent">Market Rent ($)</Label>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <Input 
                  id="monthlyRent" 
                  name="monthlyRent" 
                  type="number" 
                  step="0.01" 
                  min="0"
                  className="pl-7"
                  placeholder="1000.00" 
                />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Create Unit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}