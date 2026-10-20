import { useCallback, useEffect, useRef, useState } from "react";

import type {
  CatalogSource,
  CatalogSnapshot,
  LocalCatalog,
  SyncProgress,
} from "./types";
import type { CatalogStore } from "./storage";
import { syncCatalog } from "./sync";
import { ensureOfflineShell } from "../pwa/register";

type View = {
  snapshot?: CatalogSnapshot;
  local?: LocalCatalog;
  saved: boolean;
  state: "loading" | "online" | "saved" | "syncing" | "error";
  message: string;
  progress: SyncProgress | null;
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));

const offlineMessage = (local: LocalCatalog) =>
  `Sem internet — catálogo salvo em ${formatDate(local.activatedAt)}. Os preços podem ter mudado.`;

export function useCatalog(source: CatalogSource, store: CatalogStore) {
  const [view, setView] = useState<View>({
    saved: false,
    state: "loading",
    message: "Carregando catálogo…",
    progress: null,
  });
  const [images, setImages] = useState(new Map<string, string>());
  const current = useRef<AbortController | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  const saved = useRef(false);
  const lastCheck = useRef(0);
  const applyLocal = useCallback((local: LocalCatalog, prepared = false) => {
    saved.current = true;
    setView({
      local,
      snapshot: local.snapshot,
      saved: true,
      state: "saved",
      progress: null,
      message: !navigator.onLine
        ? offlineMessage(local)
        : prepared
          ? "Catálogo salvo para usar sem internet"
          : `Catálogo atualizado — conferido em ${formatDate(local.checkedAt)}`,
    });
  }, []);
  const update = useCallback(
    async (controller: AbortController, explicit: boolean) => {
      const signal = controller.signal;

      try {
        setView((v) => ({
          ...v,
          state: "syncing",
          progress: null,
          message: "Preparando o catálogo… Mantenha esta tela aberta.",
        }));

        if (explicit) {
          await ensureOfflineShell();
          signal.throwIfAborted();
          await navigator.storage?.persist?.().catch(() => false);
        }

        await syncCatalog(source, store, {
          now: () => new Date().toISOString(),
          signal,
          onProgress: (progress) => {
            if (!signal.aborted) setView((v) => ({ ...v, progress }));
          },
        });
        signal.throwIfAborted();
        const local = await store.readActive();

        if (local && !signal.aborted) {
          applyLocal(local, explicit);
          channel.current?.postMessage("updated");
        }
      } catch (error) {
        if (signal.aborted) return;

        const name =
          error && typeof error === "object" && "name" in error
            ? String(error.name)
            : "";
        const quota = name === "QuotaExceededError";
        setView((v) => ({
          ...v,
          state: "error",
          progress: null,
          message: quota
            ? "Não há espaço suficiente para atualizar o catálogo"
            : !navigator.locks
              ? "Para salvar offline, use um navegador atualizado, como o Chrome."
              : v.saved
                ? "Não foi possível atualizar. Você pode continuar usando o catálogo salvo"
                : "Não foi possível salvar o catálogo. Verifique a internet e o espaço disponível e tente novamente.",
        }));
      } finally {
        if (current.current === controller) current.current = null;
      }
    },
    [source, store, applyLocal],
  );
  const prepareOffline = useCallback(async () => {
    if (current.current) return;

    const controller = new AbortController();
    current.current = controller;
    await update(controller, true);
  }, [update]);

  useEffect(() => {
    const urls: string[] = [];
    const map = new Map<string, string>();

    for (const p of view.snapshot?.products ?? []) {
      const blob = view.local?.photos.get(p.imagePath);
      const url = blob
        ? URL.createObjectURL(blob)
        : (source.photoUrl?.(p.imagePath) ??
          `${import.meta.env.BASE_URL}demo/${p.imagePath}`);

      if (blob) urls.push(url);

      map.set(p.imagePath, url);
    }

    setImages(map);

    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [view.snapshot, view.local]);

  useEffect(() => {
    let disposed = false;
    const initial = new AbortController();
    current.current = initial;
    const load = async (controller: AbortController) => {
      const signal = controller.signal;
      let local: LocalCatalog | null = null;
      let storageError = false;

      try {
        local = await store.readActive();
      } catch {
        storageError = true;
      }

      if (disposed || signal.aborted) return;

      if (local) applyLocal(local);

      if (!navigator.onLine) {
        if (!local)
          setView((v) => ({
            ...v,
            state: "error",
            message:
              "Conecte-se à internet para abrir e salvar o catálogo neste aparelho.",
          }));

        if (current.current === controller) current.current = null;

        return;
      }

      lastCheck.current = Date.now();

      if (local) {
        await update(controller, false);

        return;
      }

      try {
        const snapshot = await source.getSnapshot(signal);

        if (!disposed && !signal.aborted)
          setView({
            snapshot,
            saved: false,
            state: "online",
            progress: null,
            message: storageError
              ? "Catálogo online. O armazenamento deste navegador está indisponível."
              : "Disponível online.",
          });
      } catch {
        if (!disposed && !signal.aborted)
          setView((v) => ({
            ...v,
            state: "error",
            message:
              "Não foi possível abrir o catálogo. Verifique a internet e tente novamente.",
          }));
      } finally {
        if (current.current === controller) current.current = null;
      }
    };
    void load(initial);
    const recheck = () => {
      if (
        current.current ||
        !navigator.onLine ||
        Date.now() - lastCheck.current < 60_000 ||
        document.visibilityState === "hidden"
      )
        return;

      lastCheck.current = Date.now();
      const controller = new AbortController();
      current.current = controller;
      void load(controller);
    };
    const offline = () =>
      setView((v) => ({
        ...v,
        message: v.local
          ? offlineMessage(v.local)
          : "Sem internet. Salve o catálogo quando a conexão voltar.",
      }));
    window.addEventListener("online", recheck);
    window.addEventListener("offline", offline);
    document.addEventListener("visibilitychange", recheck);
    const bc =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("catalog-updates")
        : null;
    channel.current = bc;

    if (bc)
      bc.onmessage = () => {
        void store
          .readActive()
          .then((local) => {
            if (!local || disposed) return;

            if (current.current) {
              // A completed revision from another tab is usable, but does not
              // complete this tab's own request or permit reload during it.
              setView((v) => ({
                ...v,
                local,
                snapshot: local.snapshot,
                saved: true,
              }));
            } else {
              applyLocal(local);
            }
          })
          .catch(() => {});
      };

    return () => {
      disposed = true;
      initial.abort();
      current.current?.abort();
      current.current = null;
      window.removeEventListener("online", recheck);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", recheck);
      bc?.close();

      if (channel.current === bc) channel.current = null;
    };
  }, [source, store, update, applyLocal]);

  return {
    ...view,
    products: view.snapshot?.products ?? [],
    images,
    prepareOffline,
  };
}
