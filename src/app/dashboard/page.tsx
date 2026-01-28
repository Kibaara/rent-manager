// src/app/dashboard/page.tsx
import { getDashboardMetrics } from "@/lib/dashboard-analytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, AlertTriangle, Briefcase, TrendingUp } from "lucide-react";

// Helper for currency
const formatMoney = (cents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

export default async function FinancialDashboard() {
  const metrics = await getDashboardMetrics();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
        <p className="text-gray-500">Real-time derived metrics for {currentMonth}.</p>
      </div>

      {/* 1. KEY FINANCIAL INDICATORS (The "Health" Check) */}
      <div className="grid gap-4 md:grid-cols-3">
        
        {/* Cash Flow */}
        <Card className="border-green-100 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Revenue ({currentMonth})</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatMoney(metrics.financials.monthlyRevenue)}</div>
            <p className="text-xs text-green-600">Cash collected this month</p>
          </CardContent>
        </Card>

        {/* Arrears (Assets) */}
        <Card className="border-red-100 bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-900">Total Arrears</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{formatMoney(metrics.financials.totalArrears)}</div>
            <p className="text-xs text-red-600">Unpaid Rent & Utilities (Asset)</p>
          </CardContent>
        </Card>

        {/* Deposits (Liabilities) */}
        <Card className="border-blue-100 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Security Deposits Held</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{formatMoney(metrics.financials.totalDeposits)}</div>
            <p className="text-xs text-blue-600">Total Liability (Must be held in bank)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* 2. RISK WATCHLIST (Who owes us money?) */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Tenant Risk Watchlist</CardTitle>
            <CardDescription>Tenants with outstanding balances greater than $100.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead className="text-right">Amount Owed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.riskWatchlist.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                      No high-risk tenants found. Good job!
                    </TableCell>
                  </TableRow>
                ) : (
                  metrics.riskWatchlist.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.tenantName}</TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {item.lastPaymentDate ? item.lastPaymentDate.toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        {formatMoney(item.totalOwed)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 3. PROPERTY PERFORMANCE */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Property Performance</CardTitle>
            <CardDescription>Occupancy rates per building.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {metrics.propertyPerformance.map(prop => (
                 <div key={prop.propertyId} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div>
                      <p className="font-medium">{prop.name}</p>
                      <p className="text-xs text-gray-500">Occupancy</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <Badge variant={prop.occupancyRate >= 90 ? "default" : "secondary"} className={prop.occupancyRate >= 90 ? "bg-green-600" : ""}>
                         {prop.occupancyRate.toFixed(0)}%
                       </Badge>
                    </div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}