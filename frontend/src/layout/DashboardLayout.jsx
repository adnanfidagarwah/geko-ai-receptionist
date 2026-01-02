import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
      />
      <div className="flex-1 flex flex-col">
        <Navbar
          setMobileOpen={setMobileOpen}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        <main
          className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1400px] mx-auto w-full"
          style={{
            scrollbarWidth: "none", 
            msOverflowStyle: "none", 
          }}
        >
          <style>{`main::-webkit-scrollbar { display: none; }`}</style>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
