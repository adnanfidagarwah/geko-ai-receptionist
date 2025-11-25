import React, { useEffect, useState } from "react";
import { Mail, Lock, PhoneCall, CalendarClock, Sparkles } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import signInImage from "../assets/sign.jpg";
import { login, selectAuth } from "../features/auth/authSlice";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const { status, error, token } = useSelector(selectAuth);
  const isLoading = status === "loading";

  useEffect(() => {
    if (token) {
      navigate(from, { replace: true });
    }
  }, [token, navigate, from]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }
    dispatch(login({ email, password }))
      .unwrap()
      .then(() => {
        toast.success("Welcome back!");
      })
      .catch((errMessage) => {
        const message =
          typeof errMessage === "string"
            ? errMessage
            : errMessage?.message || "Unable to sign in. Please try again.";
        toast.error(message);
      });
  };

  useEffect(() => {
    if (status === "failed" && error) {
      toast.error(error);
    }
  }, [status, error]);


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
              Let Gecko AI greet every caller with concierge-level service.
            </h1>
            <p className="text-base text-white/80">
              Our AI receptionist welcomes guests, manages bookings, and hands
              over warm leads to your team—freeing you to focus on in-person
              smiles.
            </p>
            <div className="space-y-4 text-sm text-white/90">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <PhoneCall size={18} />
                </span>
                <div>
                  <p className="font-semibold">Intelligent call triage</p>
                  <p className="text-xs text-white/70">
                    Capture intent and route callers instantly without missing a beat.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <CalendarClock size={18} />
                </span>
                <div>
                  <p className="font-semibold">Self-serve scheduling</p>
                  <p className="text-xs text-white/70">
                    Confirm reservations and appointments while you rest.
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
                Real-time performance
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold">98%</span>
                <span className="text-sm font-medium text-primary-dark/70">
                  customer satisfaction score
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8">
        <div className="card w-full max-w-md">
          <h2 className="text-2xl font-semibold text-textcolor-default mb-2">
            Sign in to your account
          </h2>
          <p className="text-sm text-textcolor-secondary mb-6">
            Welcome back! Please enter your credentials.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-muted" size={18} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-md border border-gray-100 bg-gray-100 pl-9 pr-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-muted" size={18} />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-md border border-gray-100 bg-gray-100 pl-9 pr-4 py-2 text-sm text-primary placeholder-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 transition"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-sm text-textcolor-secondary">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-accent-dark h-4 w-4"
                />
                Remember me
              </label>
              <a href="#" className="text-accent hover:underline">
                Forgot password?
              </a>
            </div>

            {error ? (
              <p className="text-sm text-red-500 text-center">{error}</p>
            ) : null}

            <button
              type="submit"
              className="btn-primary w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-sm text-textcolor-secondary text-center mt-6">
            Don’t have an account?{" "}
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() => navigate("/sign-up")}
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
