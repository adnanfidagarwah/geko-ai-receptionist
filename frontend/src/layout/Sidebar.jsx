import React, { useMemo } from "react";
import {
  LayoutDashboard,
  PhoneCall,
  Calendar,
  MessageSquare,
  Settings,
  Users,
  CreditCard,
  X,
  HeadphoneOff,
  Sparkles,
  UtensilsCrossed,
  HeartPulse,
  ShoppingBag,
  UsersRound,
  TrendingUp,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {jwtDecode} from "jwt-decode";
import logo from "../assets/logo.png";
const allNavItems = [
  { name: "Admin Overview", path: "/admin", icon: LayoutDashboard, roles: ["admin"] },
  { name: "Restaurants", path: "/admin/restaurants", icon: UtensilsCrossed, roles: ["admin"] },
  { name: "Clinics", path: "/admin/clinics", icon: HeartPulse, roles: ["admin"] },
  { name: "Overview", path: "/", icon: LayoutDashboard, roles: ["owner", "staff"], orgs: ["Clinic", "Restaurant"] },
  { name: "Receptionist Settings", path: "/agent-settings", icon: Sparkles, roles: ["owner"], orgs: ["Clinic", ""] },
  { name: "Call History", path: "/calls-history", icon: PhoneCall, roles: ["owner", "staff"], orgs: ["Clinic", "Restaurant"] },
  { name: "Appointments", path: "/appointments", icon: Calendar, roles: ["owner", "staff"], orgs: ["Clinic"] },
  { name: "Patients", path: "/patients", icon: HeartPulse, roles: ["owner", "staff"], orgs: ["Clinic"] },
  { name: "Menu Manager", path: "/menu", icon: UtensilsCrossed, roles: ["owner"], orgs: ["Restaurant"] },
  { name: "Orders", path: "/orders", icon: ShoppingBag, roles: ["owner", "staff"], orgs: ["Restaurant"] },
  { name: "Upsellings", path: "/upsellings", icon: TrendingUp, roles: ["owner", "staff"], orgs: ["Restaurant"] },
  { name: "Customers", path: "/customers", icon: UsersRound, roles: ["owner", "staff"], orgs: ["Restaurant"] },
  // { name: "AI Prompts & FAQs", path: "/prompts", icon: MessageSquare, roles: ["owner"], orgs: ["Clinic", "Restaurant"] },
  { name: "Account Settings", path: "/settings", icon: Settings, roles: ["owner", "staff"], orgs: ["Clinic", "Restaurant"] },
  // { name: "Staff Management", path: "/staff-management", icon: Users, roles: ["owner"], orgs: ["Clinic", "Restaurant"] },
  // { name: "Billing", path: "/billing", icon: CreditCard, roles: ["owner"], orgs: ["Clinic", "Restaurant"] },
];

export default function Sidebar({ mobileOpen, setMobileOpen, collapsed }) {
  const location = useLocation();

   // ✅ Decode JWT token from localStorage
  const token = localStorage.getItem("ra.auth.token");
  let decoded = null;
  try {
    if (token) decoded = jwtDecode(token);
  } catch (err) {
    console.error("Invalid token:", err);
  }

  // ✅ Extract orgModel and role
  const orgModel = decoded?.orgModel || null;
  const role = decoded?.role || null;
  const globalRoles = decoded?.globalRoles || [];

  // ✅ Filter nav items based on orgModel and role
  const navItems = useMemo(() => {
    const roleSet = new Set(
      [role, ...(Array.isArray(globalRoles) ? globalRoles : [])].filter(Boolean)
    );
    return allNavItems.filter(
      (item) =>
        (!item.orgs || item.orgs.includes(orgModel)) &&
        (!item.roles || item.roles.some((allowedRole) => roleSet.has(allowedRole)))
    );
  }, [orgModel, role, globalRoles]);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col bg-background-card border-r border-background-hover h-full transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}
        ${mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-center md:justify-start p-4 border-b border-background-hover">
          <div className="flex items-center gap-2">
            {/* <img
              src="/logo.png" // replace with actual logo
              alt="Logo"
              className="h-8 w-8 object-contain"
            /> */}
            <img src={logo} width={155} height={32} />
            {!collapsed && (
              <div>
                {/* <h1 className="text-lg font-semibold text-primary whitespace-nowrap">
                  Voice Receptionist
                </h1>
                <p className="text-xs text-muted">Business Portal</p> */}
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden ml-auto p-2 rounded-lg hover:bg-background-hover"
          >
            <X />
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {!collapsed && (
            <p className="px-2 mb-2 text-xs font-semibold uppercase text-muted">
              Navigation
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex gap-21items-center px-3 py-2 rounded-lg transition-colors ${
                  active
                    ? "bg-primary text-background font-medium"
                    : "text-textcolor-secondary hover:bg-background-hover"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span
                  className={`ml-3 text-sm flex-shrink-0 overflow-hidden whitespace-nowrap transition-all duration-300 ${
                    collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-background-hover flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-textcolor">
            BO
          </div>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            }`}
          >
            <p className="text-sm font-medium">Business Owner</p>
            <p className="text-xs text-muted whitespace-nowrap">
              owner@restaurant.com
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
