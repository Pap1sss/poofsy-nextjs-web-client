import SocketListeners from "@/config/socket";
import { PrivateRoute } from "@/features/auth";

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <PrivateRoute>
      <SocketListeners />
      {children}
    </PrivateRoute>
  );
}
