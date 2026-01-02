import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, HeartPulse, Loader2, UtensilsCrossed } from "lucide-react";
import { useGetClinicsQuery, useGetRestaurantsQuery } from "../features/api/appApi";

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatPhone = (value = "") => {
  if (!value) return "Not set";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return value;
};

const formatAddress = (record) => {
  if (!record) return "Not set";
  const parts = [record.address, record.city, record.state].filter(Boolean);
  return parts.length ? parts.join(", ") : "Not set";
};

const AdminDashboard = () => {
  const {
    data: restaurants = [],
    isLoading: restaurantsLoading,
    isFetching: restaurantsFetching,
  } = useGetRestaurantsQuery();
  const {
    data: clinics = [],
    isLoading: clinicsLoading,
    isFetching: clinicsFetching,
  } = useGetClinicsQuery();

  const recentRestaurants = useMemo(() => restaurants.slice(0, 5), [restaurants]);
  const recentClinics = useMemo(() => clinics.slice(0, 5), [clinics]);

  const renderRecent = (items, typeLabel) => {
    if ((restaurantsLoading && typeLabel === "restaurants") || (clinicsLoading && typeLabel === "clinics")) {
      return (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-background-hover bg-white/70 p-8 text-sm text-textcolor-secondary">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading {typeLabel}...
        </div>
      );
    }

    if (!items.length) {
      return (
        <div className="rounded-xl border border-dashed border-background-hover bg-white/70 p-8 text-center text-sm text-textcolor-secondary">
          No {typeLabel} found yet.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-background-hover bg-white px-4 py-3 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary-dark">
                  {item.name || `Unnamed ${typeLabel.slice(0, -1)}`}
                </p>
                <p className="mt-1 text-xs text-textcolor-secondary">
                  {formatAddress(item)} | {formatPhone(item.phone)}
                </p>
                <p className="mt-1 text-xs text-textcolor-secondary">ID: {item.id || "Not set"}</p>
              </div>
              <span className="text-xs text-textcolor-secondary">{formatDate(item.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Admin Dashboard</h1>
          <p className="text-sm text-textcolor-secondary">
            Monitor all restaurants and clinics from a single command center.
          </p>
        </div>
        <div className="text-xs text-textcolor-secondary">
          {(restaurantsFetching || clinicsFetching) && (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Syncing latest data
            </span>
          )}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/admin/restaurants"
          className="group rounded-2xl border border-background-hover bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <UtensilsCrossed className="h-5 w-5" />
            </span>
            <ArrowUpRight className="h-5 w-5 text-muted transition group-hover:text-primary" />
          </div>
          <p className="mt-4 text-sm text-textcolor-secondary">Restaurants</p>
          <p className="mt-1 text-3xl font-semibold text-primary-dark">
            {restaurantsLoading ? "..." : restaurants.length}
          </p>
          <p className="mt-1 text-xs text-textcolor-secondary">Manage menus, orders, and staff access.</p>
        </Link>

        <Link
          to="/admin/clinics"
          className="group rounded-2xl border border-background-hover bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <HeartPulse className="h-5 w-5" />
            </span>
            <ArrowUpRight className="h-5 w-5 text-muted transition group-hover:text-primary" />
          </div>
          <p className="mt-4 text-sm text-textcolor-secondary">Clinics</p>
          <p className="mt-1 text-3xl font-semibold text-primary-dark">
            {clinicsLoading ? "..." : clinics.length}
          </p>
          <p className="mt-1 text-xs text-textcolor-secondary">Track appointments, patients, and onboarding.</p>
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-background-hover bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-primary-dark">Recent restaurants</h2>
              <p className="text-xs text-textcolor-secondary">Newest locations onboarded</p>
            </div>
            <Link to="/admin/restaurants" className="text-xs font-medium text-primary">
              View all
            </Link>
          </div>
          <div className="mt-4">{renderRecent(recentRestaurants, "restaurants")}</div>
        </div>

        <div className="rounded-2xl border border-background-hover bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-primary-dark">Recent clinics</h2>
              <p className="text-xs text-textcolor-secondary">Newest clinics onboarded</p>
            </div>
            <Link to="/admin/clinics" className="text-xs font-medium text-primary">
              View all
            </Link>
          </div>
          <div className="mt-4">{renderRecent(recentClinics, "clinics")}</div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
