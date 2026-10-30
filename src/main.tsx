import { lazy, Suspense, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App";
import { AccessSkeleton } from "./components/LoadingSkeleton";
import "./styles.css";

const AdminApp = lazy(() => import("./admin/AdminApp"));
const router = createBrowserRouter([
  {
    path: "/admin/*",
    element: (
      <Suspense
        fallback={
          <div className="admin-shell">
            <AccessSkeleton label="Abrindo painel…" />
          </div>
        }
      >
        <AdminApp />
      </Suspense>
    ),
  },
  { path: "*", element: <App /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
