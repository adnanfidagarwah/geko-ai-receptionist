import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import {
  useGetRestaurantsQuery,
  useGetRestaurantOrdersQuery,
} from "../features/api/appApi";
import { selectAuth } from "../features/auth/authSlice";
import {
  Loader2,
  ShoppingBag,
  Truck,
  Bike,
  Clock4,
  CheckCircle2,
  Eye,
} from "lucide-react";
import OrderViewModal from "../components/orders/OrderViewModal";

const DEFAULT_BADGE = "Restaurant";

const formatCurrency = (value) => {
  const num = Number(value || 0);
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const OrdersPage = () => {
  const { token } = useSelector(selectAuth);
  const [activeRestaurantId, setActiveRestaurantId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

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
    data: orders = [],
    isLoading: ordersLoading,
    isFetching: ordersFetching,
  } = useGetRestaurantOrdersQuery(activeRestaurantId, { skip: !activeRestaurantId });

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((order) => {
      const haystack = [order.customer_name, order.customer_phone, order.delivery_address, order.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [orders, searchTerm]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((order) => (order.status || "").toLowerCase() === "pending").length;
    const delivery = orders.filter((order) => (order.delivery_or_pickup || "pickup") === "delivery").length;
    const revenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    return { total, pending, delivery, pickup: total - delivery, revenue };
  }, [orders]);

  const renderBadge = () => (
    <span className="inline-flex items-center gap-2 rounded-xl border border-background-hover bg-white px-4 py-2 text-sm font-medium text-primary-dark shadow-sm">
      {restaurantsLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </>
      ) : (
        activeRestaurant?.name || DEFAULT_BADGE
      )}
    </span>
  );

  const renderTable = () => {
    if (ordersLoading && !orders.length) {
      return (
        <div className="flex items-center justify-center rounded-2xl border border-background-hover bg-white/80 p-12 text-primary">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading orders…
        </div>
      );
    }

    if (!ordersLoading && filteredOrders.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-background-hover bg-white/70 p-10 text-center text-textcolor-secondary">
          No orders yet. Once callers start placing pickup or delivery requests, they’ll appear here.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-2xl border border-background-hover bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Fulfillment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-primary-dark">{order.customer_name || "Guest"}</td>
                <td className="px-4 py-3 text-textcolor-secondary">
                  {order.customer_phone ? (
                    <a className="text-primary" href={`tel:${order.customer_phone}`}>
                      {order.customer_phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-textcolor-secondary">{order.items?.length ?? 0}</td>
                <td className="px-4 py-3 font-semibold text-primary-dark">{formatCurrency(order.total_amount)}</td>
                <td className="px-4 py-3 capitalize text-textcolor-secondary">
                  {order.delivery_or_pickup || "pickup"}
                </td>
                <td className="px-4 py-3 capitalize text-textcolor-secondary">{order.status || "pending"}</td>
                <td className="px-4 py-3 text-textcolor-secondary">{formatDateTime(order.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="inline-flex items-center gap-2 rounded-lg border border-background-hover px-3 py-1.5 text-xs font-medium text-primary hover:border-primary/40 hover:bg-primary/5 transition"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
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
          <h1 className="text-xl font-semibold text-neutral-900">Orders</h1>
          <p className="text-sm text-textcolor-secondary">
            Live feed of pickup and delivery requests captured by your AI host.
          </p>
        </div>
        {renderBadge()}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">Total orders</p>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-primary-dark">
            <ShoppingBag className="h-6 w-6 text-primary" /> {stats.total}
          </div>
        </div>
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">Pending</p>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-amber-600">
            <Clock4 className="h-6 w-6" /> {stats.pending}
          </div>
        </div>
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">Deliveries</p>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-primary-dark">
            <Truck className="h-6 w-6 text-primary" /> {stats.delivery}
          </div>
          <p className="text-xs text-textcolor-secondary">Pickups: {stats.pickup}</p>
        </div>
        <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted">Revenue</p>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold text-emerald-600">
            <CheckCircle2 className="h-6 w-6" /> {formatCurrency(stats.revenue)}
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-background-hover bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-background-hover px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-64"
              placeholder="Search orders or phone numbers"
            />
          </div>
          {ordersFetching ? (
            <span className="inline-flex items-center gap-2 text-xs text-textcolor-secondary">
              <Loader2 className="h-3 w-3 animate-spin" /> Refreshing…
            </span>
          ) : null}
        </div>
        <div className="mt-4">{renderTable()}</div>
      </div>

      <OrderViewModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
};

export default OrdersPage;
