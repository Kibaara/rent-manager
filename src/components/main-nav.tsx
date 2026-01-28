'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; // standard shadcn utility
import { LayoutDashboard, Building, Users, FileText } from "lucide-react";

export function MainNav() {
  const pathname = usePathname();

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
      active: pathname === "/dashboard",
    },
    {
      href: "/properties",
      label: "Properties",
      icon: <Building className="mr-2 h-4 w-4" />,
      active: pathname.startsWith("/properties") || pathname.startsWith("/units"),
    },
    {
      href: "/tenants",
      label: "Tenants",
      icon: <Users className="mr-2 h-4 w-4" />,
      active: pathname.startsWith("/tenants"),
    },
    {
      href: "/leases",
      label: "Leases",
      icon: <FileText className="mr-2 h-4 w-4" />,
      active: pathname.startsWith("/leases"),
    },
  ];

  return (
    <nav className="border-b bg-white shadow-sm mb-8">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
        {/* Logo Area */}
        <div className="mr-8 hidden md:flex">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-slate-800">
            <Building className="h-6 w-6 text-blue-600" />
            RentManager
          </Link>
        </div>

        {/* Links */}
        <div className="flex items-center space-x-4 lg:space-x-6 mx-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center text-sm font-medium transition-colors hover:text-blue-600",
                route.active ? "text-blue-600" : "text-gray-500"
              )}
            >
              {route.icon}
              {route.label}
            </Link>
          ))}
        </div>
        
        {/* Right side placeholder (User Profile would go here) */}
        <div className="ml-auto flex items-center space-x-4">
           <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300"></div>
        </div>
      </div>
    </nav>
  );
}