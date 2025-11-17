import { WorkflowEditorPage } from "../../src/pages/WorkflowEditorPage";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";

export default function WorkflowRoute() {
  return (
    <ProtectedRoute>
      <WorkflowEditorPage />
    </ProtectedRoute>
  );
}
