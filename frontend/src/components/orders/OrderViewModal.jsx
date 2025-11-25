import clsx from "clsx";
import { X, Phone, MapPin, Truck, Receipt, Clock, User, ShoppingBag } from "lucide-react";

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

const formatCurrency = (value) => {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return "$0";
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
};

const Pill = ({ icon: Icon, label, tone = "default" }) => (
  <span
    className={clsx(
      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium capitalize",
      tone === "success" && "bg-emerald-50 text-emerald-700",
      tone === "warning" && "bg-amber-50 text-amber-700",
      tone === "info" && "bg-sky-50 text-sky-700",
      tone === "default" && "bg-background-hover text-textcolor-secondary",
    )}
  >
    {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
    {label}
  </span>
);

const renderRow = (Icon, label, value) => (
  <div className="flex items-start gap-3 rounded-xl border border-background-hover bg-background-card px-3 py-2.5">
    <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-xs uppercase tracking-wide text-textcolor-muted">{label}</p>
      <p className="text-sm font-medium text-textcolor-default break-all">{value || "—"}</p>
    </div>
  </div>
);

export default function OrderViewModal({ order, onClose }) {
  if (!order) return null;

  const items = Array.isArray(order.items) ? order.items : [];
  const status = (order.status || "pending").toLowerCase();
  const fulfillment = (order.delivery_or_pickup || "pickup").toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-background-hover px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-textcolor-secondary">
              <ShoppingBag className="h-4 w-4 text-emerald-600" />
              Order detail
            </div>
            <h3 className="text-xl font-semibold text-textcolor-default">
              {order.customer_name || "Guest"} • {formatCurrency(order.total_amount)}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Pill icon={Receipt} label={status} tone={status === "completed" ? "success" : status === "pending" ? "warning" : "default"} />
              <Pill icon={Truck} label={fulfillment} tone="info" />
              <Pill icon={Clock} label={`Created ${formatDateTime(order.created_at)}`} />
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close order detail"
            className="rounded-full p-1 text-textcolor-muted transition hover:bg-background-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-5 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {renderRow(User, "Customer", order.customer_name || "Guest")}
            {renderRow(Phone, "Phone", order.customer_phone || "—")}
            {renderRow(Receipt, "Status", (order.status || "pending").toString())}
            {renderRow(
              Truck,
              "Fulfillment",
              `${order.delivery_or_pickup || "pickup"}${order.delivery_address ? " • " + order.delivery_address : ""}`,
            )}
            {renderRow(MapPin, "Address", order.delivery_address || "—")}
          </div>

          <div className="rounded-2xl border border-background-hover bg-background-card">
            <div className="flex items-center justify-between border-b border-background-hover px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-textcolor-default">Items</p>
                <p className="text-xs text-textcolor-secondary">Captured from caller</p>
              </div>
              <span className="text-xs font-medium text-textcolor-secondary">Count: {items.length}</span>
            </div>
            <div className="divide-y divide-background-hover">
              {items.length === 0 ? (
                <div className="px-4 py-3 text-sm text-textcolor-secondary">No line items captured.</div>
              ) : (
                items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-textcolor-default">{item.name || "Item"}</p>
                      <p className="text-xs text-textcolor-secondary">
                        Qty {item.quantity ?? 1}
                        {item.notes ? ` • ${item.notes}` : ""}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-textcolor-default">
                      {formatCurrency(item.price ?? 0)}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between border-t border-background-hover px-4 py-3 text-sm font-semibold text-textcolor-default">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>

          {order.notes ? (
            <div className="rounded-2xl border border-background-hover bg-background-hover px-4 py-3 text-sm text-textcolor-default">
              <p className="text-xs uppercase tracking-wide text-textcolor-muted mb-1">Notes</p>
              {order.notes}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
