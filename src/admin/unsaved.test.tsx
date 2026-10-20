import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import AdminApp from "./AdminApp";
import { useUnsaved } from "./unsaved";
const auth = vi.hoisted(() => ({
  signOut: vi.fn().mockResolvedValue({ error: null }),
}));
vi.mock("../lib/supabase", () => ({
  getSupabaseClient: () => ({
    rpc: async () => ({ data: true, error: null }),
    auth: {
      signOut: auth.signOut,
      getSession: async () => ({ data: { session: { user: { id: "one" } } } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe() {} } },
      }),
    },
  }),
}));
vi.mock("./Management", () => ({
  Management: () => {
    const dirty = useUnsaved();
    return (
      <input
        aria-label="Nome"
        onChange={() => dirty(true)}
      />
    );
  },
}));
test("voltar pelo histórico pede confirmação e mantém a edição ao cancelar", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  const router = createMemoryRouter(
    [
      { path: "/", element: <p>Catálogo público</p> },
      { path: "/admin/*", element: <AdminApp /> },
    ],
    { initialEntries: ["/", "/admin"] },
  );
  render(<RouterProvider router={router} />);
  await userEvent.type(await screen.findByLabelText("Nome"), "Nome digitado");
  await act(async () => {
    await router.navigate(-1);
  });
  expect(confirm).toHaveBeenCalled();
  expect(screen.getByLabelText("Nome")).toHaveValue("Nome digitado");
  confirm.mockRestore();
});

for (const activation of ["pointer", "keyboard"]) {
  test(`cancelar saída por ${activation} mantém formulário e sessão`, async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const router = createMemoryRouter(
      [{ path: "/admin/*", element: <AdminApp /> }],
      { initialEntries: ["/admin"] },
    );
    render(<RouterProvider router={router} />);
    await userEvent.type(await screen.findByLabelText("Nome"), "Minha edição");
    const logout = screen.getByRole("button", { name: "Sair" });
    if (activation === "keyboard") {
      logout.focus();
      await userEvent.keyboard(" ");
    } else await userEvent.click(logout);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Nome")).toHaveValue("Minha edição");
    confirm.mockRestore();
  });
}
