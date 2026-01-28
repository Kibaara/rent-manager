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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addCharge } from '@/app/actions'; 
import { PlusCircle } from "lucide-react";

export function AddChargeDialog({ leaseId }: { leaseId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAction(formData: FormData) {
    setLoading(true);
    const amountRaw = formData.get('amount') as string;
    const amountCents = Math.round(parseFloat(amountRaw) * 100);
    const type = formData.get('type') as string;
    const description = formData.get('description') as string;

    try {
        await addCharge(leaseId, amountCents, type, description);
        setOpen(false);
    } catch (error: any) {
        alert(error.message || "Failed to add charge.");
    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Charge
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Charge</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="space-y-4">
          
          <div className="space-y-2">
            <Label>Charge Type</Label>
            {/* UPDATED: Default value is now WATER, and options are restricted */}
            <Select name="type" required defaultValue="WATER">
               <SelectTrigger>
                 <SelectValue placeholder="Select type" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="RENT">Rent</SelectItem>
                 <SelectItem value="WATER">Water</SelectItem>
                 <SelectItem value="GARBAGE">Garbage</SelectItem>
               </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input id="description" name="description" placeholder="e.g. March Bill" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <Input 
                  id="amount" 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  required 
                  className="pl-7"
                  placeholder="0.00" 
                />
            </div>
          </div>

          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
            {loading ? "Saving..." : "Add Charge"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}