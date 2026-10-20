import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import AdminApp from "../AdminApp";
const state = vi.hoisted(() => ({
  listener: (_event: string, _session: unknown) => {},
  rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
}));
vi.mock("../../lib/supabase", () => ({
  getSupabaseClient: () => ({
    rpc: state.rpc,
    auth: {
      getSession: async () => ({ data: { session: { user: { id: "one" } } } }),
      onAuthStateChange: (listener: typeof state.listener) => {
        state.listener = listener;
        return { data: { subscription: { unsubscribe() {} } } };
      },
    },
  }),
}));
vi.mock("../Management", () => ({
  Management: () => (
    <input
      aria-label="Edição em andamento"
      defaultValue=""
    />
  ),
}));
test("renovar a sessão não desmonta o formulário em andamento", async () => {
  render(
    <RouterProvider
      router={createMemoryRouter(
        [{ path: "/admin/*", element: <AdminApp /> }],
        { initialEntries: ["/admin"] },
      )}
    />,
  );
  const input = await screen.findByLabelText("Edição em andamento");
  await userEvent.type(input, "Minha edição");
  state.rpc.mockImplementationOnce(
    () =>
      new Promise((resolve) =>
        setTimeout(() => resolve({ data: true, error: null }), 50),
      ),
  );
  await act(async () => {
    state.listener("TOKEN_REFRESHED", { user: { id: "one" } });
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await waitFor(() => expect(state.rpc.mock.calls.length).toBeGreaterThan(1));
  expect(screen.getByLabelText("Edição em andamento")).toHaveValue(
    "Minha edição",
  );
});
