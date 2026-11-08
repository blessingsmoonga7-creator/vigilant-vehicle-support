// File: src/components/layout/AppLayout.jsx

import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-main, #F8F9FA)" }}>
      <Sidebar />
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar />
        <main style={{ padding: "2rem", flexGrow: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
