import React, { useMemo, useState } from "react";
import { Loader2, Search, UtensilsCrossed, Phone, MapPin } from "lucide-react";
import { useGetRestaurantsQuery } from "../features/api/appApi";

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

const AdminRestaurants = () => {
  const { data: restaurants = [], isLoading, isFetching } = useGetRestaurantsQuery();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRestaurants = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return restaurants;
    return restaurants.filter((restaurant) => {
      const haystack = [
        restaurant.name,
        restaurant.address,
        restaurant.phone,
        restaurant.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [restaurants, searchTerm]);

  const stats = useMemo(() => {
    const total = restaurants.length;
    const withPhone = restaurants.filter((restaurant) => restaurant.phone).length;
    const withAddress = restaurants.filter((restaurant) => restaurant.address).length;
    return { total, withPhone, withAddress };
  }, [restaurants]);

  const renderTable = () => {
    if (isLoading && !restaurants.length) {
      return (
        <div className="flex items-center justify-center rounded-2xl border border-background-hover bg-white/80 p-12 text-primary">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading restaurants...
        </div>
      );
    }

    if (!isLoading && filteredRestaurants.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-background-hover bg-white/70 p-10 text-center text-textcolor-secondary">
          No restaurants match this search.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-2xl border border-background-hover bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Restaurant</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRestaurants.map((restaurant) => (
              <tr key={restaurant.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-primary-dark">
                    {restaurant.name || "Unnamed restaurant"}
                  </div>
                  <div className="text-xs text-textcolor-secondary">ID: {restaurant.id || "Not set"}</div>
                </td>
                <td className="px-4 py-3 text-textcolor-secondary">
                  {formatAddress(restaurant)}
                </td>
                <td className="px-4 py-3 text-primary">
                  {restaurant.phone ? <a href={`tel:${restaurant.phone}`}>{formatPhone(restaurant.phone)}</a> : "Not set"}
                </td>
                <td className="px-4 py-3 text-textcolor-secondary">
                  {formatDate(restaurant.created_at)}
                </td>
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
          <h1 className="text-xl font-semibold text-neutral-900">Restaurants</h1>
          <p className="text-sm text-textcolor-secondary">
            Full list of restaurant partners under the admin account.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-xl border border-background-hover bg-white px-4 py-2 text-sm font-medium text-primary-dark shadow-sm">
          <UtensilsCrossed className="h-4 w-4 text-primary" /> {isLoading ? "Loading..." : `${stats.total} total`}
        </span>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">Restaurants</p>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-primary-dark">
            <UtensilsCrossed className="h-6 w-6 text-primary" /> {stats.total}
          </div>
        </div>
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">With phone</p>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-primary-dark">
            <Phone className="h-6 w-6 text-green-500" /> {stats.withPhone}
          </div>
        </div>
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">With address</p>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-primary-dark">
            <MapPin className="h-6 w-6 text-amber-500" /> {stats.withAddress}
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-background-hover py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Search restaurants by name or phone"
            />
          </div>
          {isFetching ? (
            <span className="inline-flex items-center gap-2 text-xs text-textcolor-secondary">
              <Loader2 className="h-3 w-3 animate-spin" /> Refreshing...
            </span>
          ) : null}
        </div>
        <div className="mt-4">{renderTable()}</div>
      </div>
    </div>
  );
};

export default AdminRestaurants;
