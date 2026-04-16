import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "@/components/common/CommandPalette";

export function AppLayout() {
  const { pathname } = useLocation();
  const isAttendanceWorkspace = pathname.startsWith("/teacher/attendance/workspace");

  if (isAttendanceWorkspace) {
    return (
      <div className="content-shell content-shell--workspace py-4 sm:py-5">
        <div className="lg:hidden">
          <Sidebar />
        </div>
        <div className="space-y-4">
          <Topbar />
          <Outlet />
        </div>
        <CommandPalette />
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:pl-[272px] xl:pl-[288px]">
      <Sidebar />
      <div className="content-shell py-4 sm:py-5 lg:py-6">
        <div className="min-w-0 space-y-5">
          <Topbar />
          <Outlet />
        </div>
      </div>
      <CommandPalette />
    </div>
  );
}
