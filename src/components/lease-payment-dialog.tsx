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
import { addPayment } from '@/app/actions';
import { Wallet } from "lucide-react";

export function AddPaymentDialog({ leaseId }: { leaseId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAction(formData: FormData) {
    setLoading(true);
    const amountRaw = formData.get('amount') as string;
    const amountCents = Math.round(parseFloat(amountRaw) * 100);
    const method = formData.get('method') as string;

    try {
        await addPayment(leaseId, amountCents, method);
        setOpen(false);
    } catch (error: any) {
        alert(error.message || "Failed to record payment.");
    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
            <Wallet className="mr-2 h-4 w-4" /> Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="space-y-4">
          
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select name="method" required defaultValue="CASH">
               <SelectTrigger>
                 <SelectValue placeholder="Select method" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="CASH">Cash</SelectItem>
                 <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                 <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
               </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount Received ($)</Label>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <Input 
                  id="amount" 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  required 
                  className="pl-7"
                  placeholder="1000.00" 
                />
            </div>
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? "Processing..." : "Confirm Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}