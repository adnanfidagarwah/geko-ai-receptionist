
import React, { useState } from "react";
import { Menu, Search, X, PanelRight, PanelLeft, Bell, LogOut } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { logoutUser, selectAuth } from "../features/auth/authSlice";

export default function Navbar({ setMobileOpen, collapsed, setCollapsed }) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { status } = useSelector(selectAuth);
  const loggingOut = status === "loggingOut";

  const page =
    location.pathname === "/"
      ? "Overview"
      : location.pathname.replace("/", "").replace("-", " ");

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success("Signed out successfully.");
    } catch (errMessage) {
      if (errMessage) {
        toast.error(errMessage);
      }
    } finally {
      navigate("/sign-in", { replace: true });
    }
  };

  return (
    <header className="navbar-base">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-2 rounded-lg hover:bg-background-hover"
        >
           {collapsed ? <PanelRight className="h-5 w-5 text-primary" /> : <PanelLeft className="h-5 w-5 text-primary" />}
        </button>
        <div className="flex items-center space-x-2 text-sm text-muted">
          <span className="text-primary font-medium">Dashboard</span>
          <span>/</span>
          <span>{page.charAt(0).toUpperCase() + page.slice(1)}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-1 rounded-md outline outline-1 outline-muted text-sm text-textcolor transition"
          />
        </div> */}

        {/* <div className="md:hidden flex items-center">
          {!mobileSearchOpen ? (
            <button
              className="p-2 rounded-full hover:bg-background-hover"
              onClick={() => setMobileSearchOpen(true)}
            >
              <Search className="h-5 w-5 text-primary" />
            </button>
          ) : (
            <div className="flex items-center transition w-[200px]">
              <Search className="h-5 w-5 text-muted ml-1" />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                className="flex-1 px-2 py-1 text-sm outline-none text-textcolor"
                onBlur={() => setMobileSearchOpen(false)}
              />
              <button
                className="p-1 mr-1 text-muted hover:text-primary"
                onClick={() => setMobileSearchOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div> */}

        <button className="p-2 rounded-full hover:bg-background-hover">
          <Bell className="h-5 w-5 text-primary" />
        </button>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-background-hover text-sm font-medium text-primary hover:bg-background-hover disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? "Signing out..." : "Logout"}
        </button>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="md:hidden p-2 rounded-full hover:bg-background-hover disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5 text-primary" />
        </button>

        <button
          className="md:hidden p-2 rounded-lg border border-muted"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5 text-primary" />
        </button>
      </div>
    </header>
  );
}
