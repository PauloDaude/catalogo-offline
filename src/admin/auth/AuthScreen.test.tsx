import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AuthScreen } from "./AuthScreen";
test("login inválido aparece como alerta de erro e mantém os campos", async () => {
  const client = {
    auth: {
      signInWithPassword: vi
        .fn()
        .mockResolvedValue({ error: new Error("Invalid credentials") }),
    },
  } as unknown as SupabaseClient;
  render(
    <MemoryRouter>
      <AuthScreen client={client} />
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), "teste@example.com");
  await user.type(screen.getByLabelText("Senha"), "incorrect");
  await user.click(screen.getByRole("button", { name: "Entrar" }));
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveClass("admin-auth-error");
  expect(alert).toHaveTextContent(
    "Não foi possível entrar, confira o email, a senha e sua conexão",
  );
  expect(screen.getByLabelText("Email")).toHaveValue("teste@example.com");
});
