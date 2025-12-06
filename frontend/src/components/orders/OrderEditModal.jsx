import { useEffect, useState } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
];

const FULFILLMENT_OPTIONS = ["pickup", "delivery"];

const emptyItem = () => ({
  name: "",
  quantity: 1,
  price: 0,
  notes: "",
});

export default function OrderEditModal({ order, onClose, onSave, saving }) {
  const [form, setForm] = useState(() => ({
    customer_name: "",
    customer_phone: "",
    delivery_address: "",
    delivery_or_pickup: "pickup",
    status: "pending",
    total_amount: 0,
    estimated_time: "",
    items: [emptyItem()],
  }));

  useEffect(() => {
    if (!order) return;
    const items = Array.isArray(order.items) && order.items.length ? order.items : [emptyItem()];
    setForm({
      customer_name: order.customer_name || "",
      customer_phone: order.customer_phone || "",
      delivery_address: order.delivery_address || "",
      delivery_or_pickup: (order.delivery_or_pickup || "pickup").toLowerCase(),
      status: (order.status || "pending").toLowerCase(),
      total_amount: Number(order.total_amount || 0),
      estimated_time: order.estimated_time || "",
      items: items.map((item) => ({
        name: item.name || "",
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
        notes: item.notes || "",
      })),
    });
  }, [order]);

  if (!order) return null;

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const updateItem = (idx, field, value) => {
    setForm((prev) => {
      const nextItems = prev.items.map((item, i) => (i === idx ? { ...item, [field]: value } : item));
      return { ...prev, items: nextItems };
    });
  };

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));

  const removeItem = (idx) => {
    setForm((prev) => {
      const nextItems = prev.items.filter((_, i) => i !== idx);
      return { ...prev, items: nextItems.length ? nextItems : [emptyItem()] };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const sanitizedItems = Array.isArray(form.items)
      ? form.items.map((item) => ({
          name: item.name || "",
          quantity: Number(item.quantity || 1),
          price: Number(item.price || 0),
          notes: item.notes || "",
        }))
      : [];

    onSave({
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      delivery_address: form.delivery_address,
      delivery_or_pickup: form.delivery_or_pickup,
      status: form.status,
      total_amount: Number(form.total_amount || 0),
      estimated_time: form.estimated_time || null,
      items: sanitizedItems,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-background-hover px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-textcolor-muted">Edit order</p>
            <h3 className="text-xl font-semibold text-textcolor-default">{order.customer_name || "Guest"}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close order edit"
            className="rounded-full p-2 text-textcolor-muted transition hover:bg-background-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="text-textcolor-secondary">Customer name</span>
              <input
                value={form.customer_name}
                onChange={(e) => updateField("customer_name", e.target.value)}
                className="w-full rounded-lg border border-background-hover px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. John Doe"
              />
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="text-textcolor-secondary">Customer phone</span>
              <input
                value={form.customer_phone}
                onChange={(e) => updateField("customer_phone", e.target.value)}
                className="w-full rounded-lg border border-background-hover px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="+1 234 567 890"
              />
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="text-textcolor-secondary">Fulfillment</span>
              <select
                value={form.delivery_or_pickup}
                onChange={(e) => updateField("delivery_or_pickup", e.target.value)}
                className="w-full rounded-lg border border-background-hover px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {FULFILLMENT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="text-textcolor-secondary">Status</span>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="w-full rounded-lg border border-background-hover px-3 py-2 text-sm capitalize focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm sm:col-span-2">
              <span className="text-textcolor-secondary">Delivery address</span>
              <input
                value={form.delivery_address}
                onChange={(e) => updateField("delivery_address", e.target.value)}
                className="w-full rounded-lg border border-background-hover px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="123 Main St, Springfield"
              />
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="text-textcolor-secondary">Total amount</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.total_amount}
                onChange={(e) => updateField("total_amount", e.target.value)}
                className="w-full rounded-lg border border-background-hover px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="space-y-1.5 text-sm">
              <span className="text-textcolor-secondary">Estimated time</span>
              <input
                type="text"
                value={form.estimated_time || ""}
                onChange={(e) => updateField("estimated_time", e.target.value)}
                className="w-full rounded-lg border border-background-hover px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Optional (e.g. 20 mins)"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-background-hover bg-background-card">
            <div className="flex items-center justify-between border-b border-background-hover px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-textcolor-default">Items</p>
                <p className="text-xs text-textcolor-secondary">Update names, quantities, and prices</p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 rounded-lg border border-background-hover bg-white px-3 py-1.5 text-xs font-medium text-primary transition hover:border-primary/40 hover:bg-primary/5"
              >
                <Plus className="h-4 w-4" /> Add item
              </button>
            </div>

            <div className="divide-y divide-background-hover">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid gap-3 px-4 py-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-center">
                  <input
                    value={item.name}
                    onChange={(e) => updateItem(idx, "name", e.target.value)}
                    placeholder="Item name"
                    className="w-full rounded-lg border border-background-hover px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    className="w-full rounded-lg border border-background-hover px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(idx, "price", e.target.value)}
                    className="w-full rounded-lg border border-background-hover px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      value={item.notes}
                      onChange={(e) => updateItem(idx, "notes", e.target.value)}
                      placeholder="Notes"
                      className="w-full rounded-lg border border-background-hover px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="rounded-lg border border-background-hover p-2 text-textcolor-muted transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-background-hover pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-background-hover px-4 py-2 text-sm font-medium text-textcolor-secondary transition hover:bg-background-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
