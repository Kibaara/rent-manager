'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { endLease } from '@/app/actions';
import { Ban } from "lucide-react";

interface Props {
  leaseId: string;
  currentDeposit: number;
}

export function TerminateLeaseDialog({ leaseId, currentDeposit }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [deduction, setDeduction] = useState("0");

  const deductionAmount = parseFloat(deduction) || 0;
  // Calculate Net Refund: Deposit - Damages
  const estimatedRefund = currentDeposit - (deductionAmount * 100); 

  async function handleAction(formData: FormData) {
    setLoading(true);
    const date = formData.get('date') as string;
    const desc = formData.get('description') as string;
    const amountCents = Math.round(deductionAmount * 100);

    try {
        await endLease(leaseId, date, amountCents, desc);
        setOpen(false);
    } catch (error: any) {
        alert(error.message || "Failed to end lease.");
    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
            <Ban className="mr-2 h-4 w-4" /> End Lease
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End Tenancy</DialogTitle>
          <DialogDescription>
            Calculate deductions and close the lease.
          </DialogDescription>
        </DialogHeader>
        <form action={handleAction} className="space-y-6">
          
          <div className="p-4 bg-slate-50 rounded-md space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-gray-500">Deposit Held:</span>
                <span className="font-medium">${(currentDeposit / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-500">Less Deductions:</span>
                <span className="text-red-600 font-medium">- ${(deductionAmount).toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
                <span>Net Refund Due:</span>
                <span className={estimatedRefund >= 0 ? "text-green-600" : "text-red-600"}>
                    ${(estimatedRefund / 100).toFixed(2)}
                </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Move Out Date</Label>
            <Input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
          </div>

          <div className="space-y-2">
            <Label>Deductions (Damages, Cleaning)</Label>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <Input 
                    name="amount" 
                    type="number" 
                    min="0"
                    step="0.01" 
                    className="pl-7"
                    value={deduction}
                    onChange={(e) => setDeduction(e.target.value)}
                />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Deduction Reason</Label>
            <Input name="description" placeholder="e.g. Carpet cleaning, Wall repair" />
          </div>

          <Button type="submit" className="w-full" variant="destructive" disabled={loading}>
            {loading ? "Processing..." : "Confirm Move Out"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}