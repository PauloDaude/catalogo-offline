import { lazy, Suspense, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App";
import "./styles.css";

const AdminApp = lazy(() => import("./admin/AdminApp"));
const router = createBrowserRouter([
  {
    path: "/admin/*",
    element: (
      <Suspense fallback={<p role="status">Abrindo…</p>}>
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
