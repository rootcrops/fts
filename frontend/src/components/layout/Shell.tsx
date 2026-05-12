import { Outlet } from "react-router-dom";

import { ToastProvider } from "../../hooks/useToast";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Shell() {
  return (
    <ToastProvider>
      <div className="shell">
        <Topbar />
        <Sidebar />
        <main className="shell__main">
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  );
}
