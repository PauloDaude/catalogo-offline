import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { Link, useLocation, useNavigate, useBlocker } from "react-router-dom";

import { getSupabaseClient } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { UnsavedContext, useUnsaved, useIsUnsaved } from "./unsaved";
import { Management } from "./Management";
import { AuthScreen } from "./auth/AuthScreen";

export default function AdminApp() {
  const [client] = useState<{ value?: SupabaseClient; error?: string }>(() => {
    try {
      return { value: getSupabaseClient() };
    } catch {
      return {
        error:
          "Configure o Supabase para usar o painel. Consulte as instruções do projeto.",
      };
    }
  });

  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const updateDirty = useCallback((value: boolean) => {
    dirtyRef.current = value;
    setDirty(value);
  }, []);
  const blocker = useBlocker(() => dirtyRef.current);
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm("Descartar as alterações que ainda não foram salvas?"))
      blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  return (
    <UnsavedContext.Provider value={{ dirty, setDirty: updateDirty }}>
      <main className="admin-shell">
        {client.value ? (
          <AdminSession client={client.value} />
        ) : (
          <>
            <AdminHeader />
            <p role="alert">{client.error}</p>
          </>
        )}
      </main>
    </UnsavedContext.Provider>
  );
}

function AdminSession({ client }: { client: SupabaseClient }) {
  const dirty = useIsUnsaved();
  const setDirty = useUnsaved();
  const [session, setSession] = useState<Session | null>(null);
  const [access, setAccess] = useState<
    "loading" | "login" | "denied" | "allowed"
  >("loading");
  const [warning, setWarning] = useState("");
  const activeUser = useRef<string | undefined>(undefined);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    let generation = 0;
    async function check(value: Session | null) {
      const request = ++generation;
      if (!alive) return;
      const sameUser = activeUser.current === value?.user.id;
      activeUser.current = value?.user.id;
      setSession(value);
      setAccess((previous) =>
        value
          ? sameUser && previous === "allowed"
            ? "allowed"
            : "loading"
          : "login",
      );
      if (value) {
        try {
          const { data, error } = await client.rpc("is_catalog_admin");
          if (alive && request === generation) {
            if (error) {
              setWarning(
                "Não foi possível conferir o acesso. Verifique sua conexão.",
              );
              if (!sameUser) setAccess("denied");
            } else {
              setWarning("");
              setAccess(data === true ? "allowed" : "denied");
            }
          }
        } catch {
          if (alive && request === generation) {
            setWarning(
              "Não foi possível conferir o acesso. Verifique sua conexão.",
            );
            if (!sameUser) setAccess("denied");
          }
        }
      }
    }
    void client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!error) void check(data.session);
        else if (alive) setAccess("login");
      })
      .catch(() => {
        if (alive) setAccess("login");
      });
    const { data } = client.auth.onAuthStateChange((_event, value) => {
      // Run API work outside the Auth callback to avoid locking the session refresh.
      window.setTimeout(() => void check(value), 0);
    });

    return () => {
      alive = false;
      generation++;
      data.subscription.unsubscribe();
    };
  }, [client]);

  useEffect(() => {
    if (access === "login" && location.pathname === "/admin")
      navigate("/admin/entrar", { replace: true });
    if (access === "allowed" && location.pathname === "/admin/entrar")
      navigate("/admin", { replace: true });
  }, [access, location.pathname, navigate]);

  const logout = session ? (
    <Button
      variant="outline"
      className="touch-button"
      onPress={async () => {
        if (
          dirty &&
          !window.confirm("Descartar as alterações que ainda não foram salvas?")
        )
          return;
        setDirty(false);
        try {
          const { error } = await client.auth.signOut();
          if (error) throw error;
          setSession(null);
          setAccess("login");
          navigate("/admin/entrar", { replace: true });
        } catch {
          setDirty(dirty);
          setWarning(
            "Não foi possível sair, confira sua conexão e tente novamente",
          );
        }
      }}
    >
      Sair da conta
    </Button>
  ) : null;
  const layout = (content: React.ReactNode) => (
    <>
      <AdminHeader>{logout}</AdminHeader>
      {content}
    </>
  );

  if (access === "loading")
    return layout(<p role="status">Conferindo acesso…</p>);
  if (location.pathname === "/admin/recuperar-senha")
    return layout(
      session ? (
        <AuthScreen
          client={client}
          recovery
        />
      ) : (
        <section className="admin-surface">
          <p>Abra o link enviado ao seu email para definir a senha</p>
          <Link to="/admin/entrar">Voltar ao login</Link>
        </section>
      ),
    );
  if (access === "login") return layout(<AuthScreen client={client} />);

  return layout(
    <section key={session?.user.id}>
      {access === "denied" && (
        <p
          role="alert"
          className="admin-error"
        >
          Esta conta não tem acesso ao painel, peça autorização ao responsável
        </p>
      )}
      {warning && (
        <p
          role="alert"
          className="admin-error"
        >
          {warning}
        </p>
      )}
      {access === "allowed" && <Management client={client} />}
    </section>,
  );
}

function AdminHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="admin-header">
      <Link to="/">
        <img
          src={`${import.meta.env.BASE_URL}logos/logo-cirandinha.png`}
          alt="Cirandinha Variedades"
          className="brand-logo"
        />
      </Link>
      <div className="admin-header-actions">
        <Link to="/">Ver catálogo</Link>
        {children}
      </div>
    </header>
  );
}
