import { render, screen } from "@testing-library/react";
import { test, expect, vi } from "vitest";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import AdminApp from "./AdminApp";
vi.mock("../lib/supabase", () => ({
  getSupabaseClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe() {} } },
      }),
    },
  }),
}));
test("visitante encontra login sem formulário de cadastro", async () => {
  render(
    <RouterProvider
      router={createMemoryRouter(
        [{ path: "/admin/*", element: <AdminApp /> }],
        { initialEntries: ["/admin"] },
      )}
    />,
  );
  expect(
    await screen.findByRole("heading", { name: "Entrar no painel" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  expect(screen.queryByText("Criar conta")).not.toBeInTheDocument();
});
