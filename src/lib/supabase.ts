import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function parseSupabaseConfig(
  url: unknown,
  key: unknown,
): { url: string; key: string } {
  if (typeof url !== "string" || typeof key !== "string")
    throw new Error("Configure o Supabase antes de abrir o painel.");

  const parsed = new URL(url);
  const local = ["localhost", "127.0.0.1"].includes(parsed.hostname);

  if (
    (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== "/"
  )
    throw new Error("URL do Supabase inválida.");

  let publicKey = key.startsWith("sb_publishable_");

  if (key.startsWith("eyJ")) {
    try {
      publicKey = JSON.parse(atob(key.split(".")[1])).role === "anon";
    } catch {
      publicKey = false;
    }
  }

  if (!publicKey)
    throw new Error("Use somente a chave publishable/anon do Supabase.");

  return { url: parsed.origin, key };
}

let adminClient: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  const { url, key } = parseSupabaseConfig(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  );

  return (adminClient ??= createClient(url, key, {
    auth: { storageKey: "cirandinha-admin-auth", flowType: "pkce" },
  }));
}

export function createPublicSupabaseClient(): SupabaseClient {
  const { url, key } = parseSupabaseConfig(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  );

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
