// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import CallsHistory from "./pages/CallsHistory";
import StaffManagement from "./pages/StaffManagement";
import Appointments from "./pages/Appointments";
import Settings from "./pages/Settings";
import PromptsFaq from "./pages/PromptsFaq";
import Menu from "./pages/Menu";
import SignIn from "./auth/SignIn";
import SignUp from "./auth/SignUp";
import RequireAuth from "./auth/RequireAuth";
import AgentSettings from "./pages/AgentSettings";
import Patients from "./pages/Patients";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Upsellings from "./pages/Upsellings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRestaurants from "./pages/AdminRestaurants";
import AdminClinics from "./pages/AdminClinics";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calls-history" element={<CallsHistory />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/staff-management" element={<StaffManagement />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/upsellings" element={<Upsellings />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/restaurants" element={<AdminRestaurants />} />
            <Route path="/admin/clinics" element={<AdminClinics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/prompts" element={<PromptsFaq />} />
            <Route path="/agent-settings" element={<AgentSettings />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
