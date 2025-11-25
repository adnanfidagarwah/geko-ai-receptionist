import React, { useEffect, useMemo, useState } from "react";
import {
  Mail,
  Lock,
  PhoneCall,
  CalendarClock,
  Sparkles,
  Building2,
  MapPin,
  Phone,
  Utensils,
  Plus,
  Trash2,
  Stethoscope,
  Clock,
  DollarSign,
  User,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { registerOwner, selectAuth } from "../features/auth/authSlice";
import signInImage from "../assets/sign.jpg";

const ORG_TYPES = [
  { value: "Restaurant", label: "Restaurant" },
  { value: "Clinic", label: "Clinic" },
];

const emptyMenuItem = () => ({
  name: "",
  description: "",
  price: "",
  category: "",
});

const emptyService = () => ({
  name: "",
  durationMinutes: "",
  price: "",
});

const SignUp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, token } = useSelector(selectAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [orgType, setOrgType] = useState("Restaurant");
  const [orgName, setOrgName] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [menuItems, setMenuItems] = useState([emptyMenuItem()]);
  const [services, setServices] = useState([emptyService()]);

  const isSubmitting = status === "registering";
  const showMenuBuilder = orgType === "Restaurant";
  const showServiceBuilder = orgType === "Clinic";

  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (status === "failed" && error) {
      toast.error(error);
    }
  }, [status, error]);

  useEffect(() => {
    if (orgType === "Restaurant" && menuItems.length === 0) {
      setMenuItems([emptyMenuItem()]);
    }
    if (orgType === "Clinic" && services.length === 0) {
      setServices([emptyService()]);
    }
  }, [orgType, menuItems.length, services.length]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!name || !email || !password || !orgName) {
      toast.error("Please fill in your name, email, password, and organization name.");
      return;
    }

    const payload = {
      email,
      password,
      name,
      phone,
      address,
      orgType,
      org: {
        name: orgName,
        phone: orgPhone,
        address: orgAddress,
      },
      menuItems: showMenuBuilder
        ? menuItems
            .filter((item) => item.name || item.price || item.category)
            .map((item) => ({
              name: item.name,
              description: item.description,
              price: item.price ? Number(item.price) : 0,
              category: item.category || "General",
            }))
        : [],
      services: showServiceBuilder
        ? services
            .filter((service) => service.name || service.price)
            .map((service) => ({
              name: service.name,
              durationMinutes: service.durationMinutes
                ? Number(service.durationMinutes)
                : 30,
              price: service.price ? Number(service.price) : 0,
            }))
        : [],
      globalRoles: [],
    };

    dispatch(registerOwner(payload))
      .unwrap()
      .then(() => {
        toast.success("Account created successfully!");
        navigate("/");
      })
      .catch((errMessage) => {
        const message =
          typeof errMessage === "string"
            ? errMessage
            : errMessage?.message || "Unable to sign up. Please try again.";
        toast.error(message);
      });
  };

  const menuItemsClean = useMemo(
    () =>
      menuItems.map((item, index) => ({
        ...item,
        key: `menu-${index}`,
      })),
    [menuItems],
  );

  const servicesClean = useMemo(
    () =>
      services.map((service, index) => ({
        ...service,
        key: `service-${index}`,
      })),
    [services],
  );

  const updateMenuItem = (idx, field, value) => {
    setMenuItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const updateService = (idx, field, value) => {
    setServices((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const removeMenuItem = (idx) => {
    setMenuItems((prev) => prev.filter((_, index) => index !== idx));
  };

  const removeService = (idx) => {
    setServices((prev) => prev.filter((_, index) => index !== idx));
  };

  return (
    <div className="min-h-screen flex bg-background.DEFAULT">
      <div className="hidden md:flex relative w-1/2 overflow-hidden bg-gradient-to-br from-primary-dark via-primary-dark/80 to-primary text-white p-12">
        <div className="absolute inset-0">
          <div className="absolute -top-32 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl opacity-70" />
          <div className="absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-accent/30 blur-3xl opacity-60" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-white/10 opacity-40" />
        </div>
        <div className="relative z-10 flex w-full flex-col justify-between">
          <div className="max-w-lg space-y-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/70">
              <Sparkles size={18} className="text-accent" />
              <span>Gecko AI Reception</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight">
              Launch your AI-powered reception experience in minutes.
            </h1>
            <p className="text-base text-white/80">
              Create your business account, sync menus or services, and let the
              assistant start greeting your guests while you focus on in-person
              hospitality.
            </p>
            <div className="space-y-4 text-sm text-white/90">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <PhoneCall size={18} />
                </span>
                <div>
                  <p className="font-semibold">24/7 reception coverage</p>
                  <p className="text-xs text-white/70">
                    Your AI receptionist keeps every caller engaged and
                    supported around the clock.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <CalendarClock size={18} />
                </span>
                <div>
                  <p className="font-semibold">Bookings without bottlenecks</p>
                  <p className="text-xs text-white/70">
                    Sync availability, accept reservations, and confirm
                    appointments automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative mt-12 self-end">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-white/10 blur-2xl opacity-60" />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 backdrop-blur-md shadow-2xl">
              <img
                src={signInImage}
                alt="AI Receptionist in action"
                className="h-60 w-80 object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-6 right-6 rounded-2xl border border-white/20 bg-white/90 px-6 py-4 text-primary-dark shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">
                Avg. onboarding time
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold">12 min</span>
                <span className="text-sm font-medium text-primary-dark/70">
                  from account creation to first call
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8">
        <div className="card w-full max-w-2xl">
          <h2 className="text-2xl font-semibold text-textcolor-default mb-2">
            Create your owner account
          </h2>
          <p className="text-sm text-textcolor-secondary mb-6">
            Tell us about you and your organization so we can tailor your AI
            receptionist instantly.
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-textcolor-default uppercase tracking-wide">
                Owner details
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-gray-600">Full name</span>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-muted" size={18} />
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-md border border-gray-100 bg-gray-100 pl-9 pr-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-gray-600">Phone number</span>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 text-muted" size={18} />
                    <input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="w-full rounded-md border border-gray-100 bg-gray-100 pl-9 pr-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-1 text-sm md:col-span-2">
                  <span className="text-gray-600">Email address</span>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 text-muted" size={18} />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-md border border-gray-100 bg-gray-100 pl-9 pr-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
                      required
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-1 text-sm md:col-span-2">
                  <span className="text-gray-600">Password</span>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-muted" size={18} />
                    <input
                      type="password"
                      placeholder="Choose a secure password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-md border border-gray-100 bg-gray-100 pl-9 pr-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
                      required
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-1 text-sm md:col-span-2">
                  <span className="text-gray-600">Mailing address</span>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 text-muted" size={18} />
                    <input
                      type="text"
                      placeholder="123 Main St, Springfield"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      className="w-full rounded-md border border-gray-100 bg-gray-100 pl-9 pr-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
                    />
                  </div>
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-textcolor-default uppercase tracking-wide">
                Organization
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-gray-600">Organization type</span>
                  <select
                    value={orgType}
                    onChange={(event) => setOrgType(event.target.value)}
                    className="w-full rounded-md border border-gray-100 bg-gray-100 px-4 py-2 text-sm text-primary focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
                  >
                    {ORG_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-gray-600">Organization phone</span>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 text-muted" size={18} />
                    <input
                      type="tel"
                      placeholder="+1 (555) 987-6543"
                      value={orgPhone}
                      onChange={(event) => setOrgPhone(event.target.value)}
                      className="w-full rounded-md border border-gray-100 bg-gray-100 pl-9 pr-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-1 text-sm md:col-span-2">
                  <span className="text-gray-600">Organization name</span>
                  <div className="relative">
                    <Building2
                      className="absolute left-3 top-2.5 text-muted"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Acme Bistro"
                      value={orgName}
                      onChange={(event) => setOrgName(event.target.value)}
                      className="w-full rounded-md border border-gray-100 bg-gray-100 pl-9 pr-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
                      required
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-1 text-sm md:col-span-2">
                  <span className="text-gray-600">Organization address</span>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 text-muted" size={18} />
                    <input
                      type="text"
                      placeholder="456 Elm St, Springfield"
                      value={orgAddress}
                      onChange={(event) => setOrgAddress(event.target.value)}
                      className="w-full rounded-md border border-gray-100 bg-gray-100 pl-9 pr-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
                    />
                  </div>
                </label>
              </div>
            </section>

            {showMenuBuilder ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-textcolor-default uppercase tracking-wide">
                    Menu snapshot
                  </h3>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
                    onClick={() => setMenuItems((prev) => [...prev, emptyMenuItem()])}
                  >
                    <Plus size={16} />
                    Add item
                  </button>
                </div>
                <p className="text-xs text-textcolor-secondary">
                  Add a few popular dishes so the receptionist can speak to them right
                  away. You can add more later inside the dashboard.
                </p>
                <div className="space-y-4">
                  {menuItemsClean.map((item, index) => (
                    <div
                      key={item.key}
                      className="rounded-lg border border-gray-100 bg-gray-50/60 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-semibold text-textcolor-default flex items-center gap-2">
                          <Utensils size={16} />
                          Item {index + 1}
                        </h4>
                        {menuItems.length > 1 && (
                          <button
                            type="button"
                            className="text-xs text-red-500 hover:underline inline-flex items-center gap-1"
                            onClick={() => removeMenuItem(index)}
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-gray-500">
                          Name
                          <input
                            type="text"
                            value={item.name}
                            onChange={(event) =>
                              updateMenuItem(index, "name", event.target.value)
                            }
                            className="text-sm rounded-md border border-gray-100 bg-white px-3 py-2 text-primary focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-gray-500">
                          Category
                          <input
                            type="text"
                            value={item.category}
                            onChange={(event) =>
                              updateMenuItem(index, "category", event.target.value)
                            }
                            className="text-sm rounded-md border border-gray-100 bg-white px-3 py-2 text-primary focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-gray-500 md:col-span-2">
                          Description
                          <textarea
                            value={item.description}
                            onChange={(event) =>
                              updateMenuItem(index, "description", event.target.value)
                            }
                            rows={2}
                            className="text-sm rounded-md border border-gray-100 bg-white px-3 py-2 text-primary focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-gray-500">
                          Price
                          <div className="relative">
                            <DollarSign
                              size={16}
                              className="absolute left-3 top-2.5 text-muted"
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(event) =>
                                updateMenuItem(index, "price", event.target.value)
                              }
                              className="text-sm rounded-md border border-gray-100 bg-white pl-8 pr-3 py-2 text-primary focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition w-full"
                            />
                          </div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {showServiceBuilder ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-textcolor-default uppercase tracking-wide">
                    Services snapshot
                  </h3>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
                    onClick={() => setServices((prev) => [...prev, emptyService()])}
                  >
                    <Plus size={16} />
                    Add service
                  </button>
                </div>
                <p className="text-xs text-textcolor-secondary">
                  Add a few key services so the receptionist can recommend and book
                  confidently. Additional services can be added later.
                </p>
                <div className="space-y-4">
                  {servicesClean.map((service, index) => (
                    <div
                      key={service.key}
                      className="rounded-lg border border-gray-100 bg-gray-50/60 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-semibold text-textcolor-default flex items-center gap-2">
                          <Stethoscope size={16} />
                          Service {index + 1}
                        </h4>
                        {services.length > 1 && (
                          <button
                            type="button"
                            className="text-xs text-red-500 hover:underline inline-flex items-center gap-1"
                            onClick={() => removeService(index)}
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-gray-500 md:col-span-2">
                          Name
                          <input
                            type="text"
                            value={service.name}
                            onChange={(event) =>
                              updateService(index, "name", event.target.value)
                            }
                            className="text-sm rounded-md border border-gray-100 bg-white px-3 py-2 text-primary focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-gray-500">
                          Duration (minutes)
                          <div className="relative">
                            <Clock
                              size={16}
                              className="absolute left-3 top-2.5 text-muted"
                            />
                            <input
                              type="number"
                              min="5"
                              step="5"
                              value={service.durationMinutes}
                              onChange={(event) =>
                                updateService(
                                  index,
                                  "durationMinutes",
                                  event.target.value,
                                )
                              }
                              className="text-sm rounded-md border border-gray-100 bg-white pl-8 pr-3 py-2 text-primary focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition w-full"
                            />
                          </div>
                        </label>
                        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-gray-500">
                          Price
                          <div className="relative">
                            <DollarSign
                              size={16}
                              className="absolute left-3 top-2.5 text-muted"
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={service.price}
                              onChange={(event) =>
                                updateService(index, "price", event.target.value)
                              }
                              className="text-sm rounded-md border border-gray-100 bg-white pl-8 pr-3 py-2 text-primary focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition w-full"
                            />
                          </div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {error ? (
              <p className="text-sm text-red-500 text-center">{error}</p>
            ) : null}

            <button
              type="submit"
              className="btn-primary w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-sm text-textcolor-secondary text-center mt-6">
            Already have an account?{" "}
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() => navigate("/sign-in")}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
