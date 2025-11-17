import { DashboardPage } from "../../src/pages/DashboardPage";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";

export default function DashboardRoute() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}
