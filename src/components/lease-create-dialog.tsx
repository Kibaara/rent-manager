'use client';

import { useState, useMemo } from 'react';
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
import { createLease } from '@/app/actions';
import { FilePlus } from "lucide-react";

type Tenant = { id: string; name: string };
type Unit = { id: string; unitNumber: string; monthlyRent: number; leases: { isActive: boolean }[] };
type Property = { id: string; name: string; units: Unit[] };

interface Props {
  tenants: Tenant[];
  properties: Property[];
}

export function DraftLeaseDialog({ tenants, properties }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [selectedTenant, setSelectedTenant] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [rentAmount, setRentAmount] = useState(""); 
  const [depositAmount, setDepositAmount] = useState(""); // NEW STATE
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const availableUnits = useMemo(() => {
    if (!selectedProperty) return [];
    const prop = properties.find(p => p.id === selectedProperty);
    return prop ? prop.units : [];
  }, [selectedProperty, properties]);

  const handleUnitChange = (unitId: string) => {
    setSelectedUnit(unitId);
    const unit = properties.flatMap(p => p.units).find(u => u.id === unitId);
    if (unit) {
      const rentStr = (unit.monthlyRent / 100).toFixed(2);
      setRentAmount(rentStr);
      setDepositAmount(rentStr); // Suggest Deposit = 1 Month Rent
    }
  };

  async function handleAction(formData: FormData) {
    setLoading(true);
    try {
        const rentCents = Math.round(parseFloat(rentAmount) * 100);
        const depositCents = Math.round(parseFloat(depositAmount || "0") * 100);
        
        await createLease(
            selectedTenant,
            selectedUnit,
            startDate,
            rentCents,
            depositCents // Pass the deposit
        );
        
        setOpen(false);
        // Reset
        setSelectedTenant("");
        setSelectedUnit("");
        setSelectedProperty("");
        setRentAmount("");
        setDepositAmount("");
    } catch (error: any) {
        alert(error.message || "Failed to create lease.");
    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
            <FilePlus className="mr-2 h-4 w-4" /> Draft New Lease
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Draft New Lease</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="space-y-4">
          
          <div className="space-y-2">
            <Label>Tenant</Label>
            <Select onValueChange={setSelectedTenant} required>
              <SelectTrigger>
                <SelectValue placeholder="Select Tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Property</Label>
            <Select onValueChange={setSelectedProperty} required>
              <SelectTrigger>
                <SelectValue placeholder="Select Property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Unit</Label>
            <Select onValueChange={handleUnitChange} disabled={!selectedProperty} required>
              <SelectTrigger>
                <SelectValue placeholder="Select Unit" />
              </SelectTrigger>
              <SelectContent>
                {availableUnits.map(u => {
                    const isOccupied = u.leases.some(l => l.isActive);
                    return (
                        <SelectItem key={u.id} value={u.id} disabled={isOccupied}>
                            Unit {u.unitNumber} {isOccupied ? "(Occupied)" : ""}
                        </SelectItem>
                    );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="start">Start Date</Label>
                <Input 
                    type="date" 
                    id="start" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    required 
                />
             </div>

             <div className="space-y-2">
                <Label htmlFor="rent">Monthly Rent</Label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <Input 
                        id="rent" 
                        type="number" 
                        step="0.01" 
                        className="pl-7"
                        value={rentAmount}
                        onChange={e => setRentAmount(e.target.value)}
                        required
                    />
                </div>
             </div>
          </div>

          {/* NEW: Security Deposit Input */}
          <div className="space-y-2">
            <Label htmlFor="deposit">Security Deposit</Label>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <Input 
                    id="deposit" 
                    type="number" 
                    step="0.01" 
                    className="pl-7"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                />
            </div>
            <p className="text-xs text-gray-500">Leaving this blank means no deposit.</p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Finalizing Move-In..." : "Create Lease & Charge Deposit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}