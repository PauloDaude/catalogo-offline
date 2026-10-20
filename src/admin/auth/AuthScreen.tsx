import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Link } from "react-router-dom";
import { Form, TextField, Label, Input } from "react-aria-components";

import { CircleAlert } from "lucide-react";
import { Button } from "../../components/ui/button";

export function AuthScreen({
  client,
  recovery = false,
}: {
  client: SupabaseClient;
  recovery?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reset, setReset] = useState(false);

  return (
    <section className="admin-auth admin-surface">
      <h1>
        {recovery
          ? "Definir nova senha"
          : reset
            ? "Recuperar senha"
            : "Entrar no painel"}
      </h1>
      <p>Gerencie os produtos da Cirandinha com conexão à internet</p>
      <Form
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          if (!navigator.onLine) {
            setHasError(true);
            setMessage("Conecte-se à internet para continuar");
            return;
          }
          setBusy(true);
          setMessage("");
          setHasError(false);
          const fields = new FormData(event.currentTarget);
          try {
            const email = String(fields.get("email") ?? "").trim();
            const password = String(fields.get("password") ?? "");
            const result = recovery
              ? await client.auth.updateUser({ password })
              : reset
                ? await client.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/admin/recuperar-senha`,
                  })
                : await client.auth.signInWithPassword({ email, password });
            if (result.error) throw result.error;
            setMessage(
              recovery
                ? "Senha atualizada, você já pode usar o painel"
                : reset
                  ? "Se este email tiver uma conta, você receberá um link para recuperar a senha."
                  : "Acesso confirmado",
            );
          } catch {
            setHasError(true);
            setMessage(
              recovery
                ? "Não foi possível atualizar a senha, solicite um novo link de recuperação"
                : "Não foi possível entrar, confira o email, a senha e sua conexão",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {!recovery && (
          <TextField
            name="email"
            type="email"
            isRequired
          >
            <Label>Email</Label>
            <Input autoComplete="username" />
          </TextField>
        )}
        {!reset && (
          <TextField
            name="password"
            type="password"
            isRequired
            minLength={recovery ? 12 : 1}
          >
            <Label>
              {recovery ? "Nova senha (mínimo 12 caracteres)" : "Senha"}
            </Label>
            <Input
              autoComplete={recovery ? "new-password" : "current-password"}
            />
          </TextField>
        )}
        <Button
          type="submit"
          className="touch-button"
          isDisabled={busy}
        >
          {busy
            ? "Aguarde…"
            : recovery
              ? "Salvar nova senha"
              : reset
                ? "Enviar link"
                : "Entrar"}
        </Button>
      </Form>
      {message && (
        <div
          role={hasError ? "alert" : "status"}
          className={hasError ? "admin-error admin-auth-error" : "admin-notice"}
        >
          {hasError && <CircleAlert aria-hidden="true" />}
          <span>{message}</span>
        </div>
      )}
      {!recovery && (
        <Button
          variant="ghost"
          className="touch-button"
          onPress={() => {
            setReset(!reset);
            setMessage("");
          }}
        >
          {reset ? "Voltar para entrar" : "Esqueci minha senha"}
        </Button>
      )}
      <Link to="/">Voltar ao catálogo</Link>
    </section>
  );
}
