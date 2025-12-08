import { CreditCard, ReceiptText } from "lucide-react";

const subscription = {
  plan: "Pro Clinic",
  amount: "$129 / mo",
  renewalDate: "Oct 23, 2024",
};

const billingMethod = {
  brand: "Visa",
  last4: "4242",
  updatedAt: "Sep 15, 2024",
};

const AccountSettings = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <ReceiptText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-textcolor-secondary">Subscription</p>
            <h2 className="text-lg font-semibold text-primary-dark">
              {subscription.plan}
            </h2>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm text-textcolor-secondary">
          <div className="flex items-center justify-between">
            <span>Monthly cost</span>
            <span className="font-medium text-primary-dark">
              {subscription.amount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Renews on</span>
            <span className="font-medium text-primary-dark">
              {subscription.renewalDate}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn-primary bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark">
            Manage billing
          </button>
          <button className="rounded-xl border border-bordercolor px-4 py-2 text-sm font-medium text-primary-dark transition hover:border-primary hover:text-primary">
            Download invoice
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-accent/10 p-3 text-accent">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-textcolor-secondary">Billing method</p>
            <h2 className="text-lg font-semibold text-primary-dark">
              {billingMethod.brand} ending in {billingMethod.last4}
            </h2>
            <p className="text-xs text-textcolor-secondary">
              Updated {billingMethod.updatedAt}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <button className="btn-primary bg-background-hover px-4 py-2 text-sm font-medium text-primary-dark transition hover:bg-background-hover/80">
            Update payment method
          </button>
        </div>
      </section>
    </div>
  );
};

export default AccountSettings;
