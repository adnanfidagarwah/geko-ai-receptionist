import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import {
  useGetRestaurantsQuery,
  useGetRestaurantCustomersQuery,
} from "../features/api/appApi";
import { selectAuth } from "../features/auth/authSlice";
import { Loader2, UsersRound, Phone, Sparkles } from "lucide-react";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const CustomersPage = () => {
  const { token } = useSelector(selectAuth);
  const [activeRestaurantId, setActiveRestaurantId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const preferredRestaurantId = useMemo(() => {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      if ((decoded?.orgModel || decoded?.org_type) === "Restaurant") {
        return decoded?.restaurant_id || decoded?.orgId || null;
      }
    } catch (error) {
      console.error("Failed to decode auth token", error);
    }
    return null;
  }, [token]);

  const { data: restaurants = [], isLoading: restaurantsLoading } = useGetRestaurantsQuery();

  useEffect(() => {
    if (preferredRestaurantId) {
      setActiveRestaurantId(preferredRestaurantId);
    } else if (!activeRestaurantId && restaurants.length) {
      setActiveRestaurantId(restaurants[0].id);
    }
  }, [restaurants, preferredRestaurantId, activeRestaurantId]);

  const activeRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === activeRestaurantId) || restaurants[0],
    [restaurants, activeRestaurantId],
  );

  const {
    data: customers = [],
    isLoading: customersLoading,
    isFetching: customersFetching,
  } = useGetRestaurantCustomersQuery(activeRestaurantId, { skip: !activeRestaurantId });

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) => {
      const haystack = [customer.full_name, customer.phone, customer.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [customers, searchTerm]);

  const stats = useMemo(() => {
    const total = customers.length;
    const returning = customers.filter((customer) => Number(customer.total_orders || 0) > 1).length;
    const recent = customers.filter((customer) => {
      if (!customer.last_order_at) return false;
      const last = new Date(customer.last_order_at);
      const now = new Date();
      const diffDays = (now - last) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    }).length;
    return { total, returning, recent };
  }, [customers]);

  const badge = (
    <span className="inline-flex items-center gap-2 rounded-xl border border-background-hover bg-white px-4 py-2 text-sm font-medium text-primary-dark shadow-sm">
      {restaurantsLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </>
      ) : (
        activeRestaurant?.name || "Restaurant"
      )}
    </span>
  );

  const renderTable = () => {
    if (customersLoading && !customers.length) {
      return (
        <div className="flex items-center justify-center rounded-2xl border border-background-hover bg-white/80 p-12 text-primary">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading customers…
        </div>
      );
    }

    if (!customersLoading && filteredCustomers.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-background-hover bg-white/70 p-10 text-center text-textcolor-secondary">
          No guests yet. Once callers start placing orders, their contact info will show up here.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-2xl border border-background-hover bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Last Order</th>
              <th className="px-4 py-3">Orders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-primary-dark">{customer.full_name || "Guest"}</td>
                <td className="px-4 py-3 text-primary">
                  {customer.phone ? (
                    <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-textcolor-secondary">{customer.email || "—"}</td>
                <td className="px-4 py-3 text-textcolor-secondary">{formatDate(customer.last_order_at)}</td>
                <td className="px-4 py-3 text-textcolor-secondary">{customer.total_orders ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Customers</h1>
          <p className="text-sm text-textcolor-secondary">
            Automatically capture caller info for faster re-orders and VIP treatment.
          </p>
        </div>
        {badge}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">Guests on file</p>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-primary-dark">
            <UsersRound className="h-6 w-6 text-primary" /> {stats.total}
          </div>
        </div>
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">Returning</p>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-primary-dark">
            <Sparkles className="h-6 w-6 text-amber-500" /> {stats.returning}
          </div>
          <p className="text-xs text-textcolor-secondary">Repeat callers with 2+ orders</p>
        </div>
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">Active (30d)</p>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-primary-dark">
            <Phone className="h-6 w-6 text-green-500" /> {stats.recent}
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-xl border border-background-hover px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-64"
            placeholder="Search guests by name or phone"
          />
          {customersFetching ? (
            <span className="inline-flex items-center gap-2 text-xs text-textcolor-secondary">
              <Loader2 className="h-3 w-3 animate-spin" /> Refreshing…
            </span>
          ) : null}
        </div>
        <div className="mt-4">{renderTable()}</div>
      </div>
    </div>
  );
};

export default CustomersPage;
