import { Navigate, Outlet } from "react-router-dom";
import type { Role } from "@/types/domain";
import { useAuthStore } from "@/store/auth-store";

interface RoleGuardProps {
  allowedRoles: Role[];
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate replace to={`/${user.role.toLowerCase()}/dashboard`} />;
  }

  return <Outlet />;
}
