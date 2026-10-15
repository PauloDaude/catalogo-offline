import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useCatalog } from "./useCatalog";
import { createCatalogStore, type CatalogStore } from "./storage";
import { snapshotA, snapshotB } from "../test/fixtures";
import { installBrowserFakes, makeSource, jpeg } from "../test/sync-fixtures";
vi.mock("../pwa/register", () => ({
  ensureOfflineShell: async () => {},
  requestAppUpdate: async () => {},
}));
let store: CatalogStore;
beforeEach(() => {
  installBrowserFakes();
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: () => "blob:test",
      revokeObjectURL: () => {},
    }),
  );
  store = createCatalogStore(crypto.randomUUID());
});
afterEach(() => store.close());
test("primeira visita consulta sem baixar fotos automaticamente", async () => {
  const source = makeSource(snapshotA);
  source.getPhoto = async () => {
    throw new Error("bulk download on visit");
  };
  const { result } = renderHook(() => useCatalog(source, store));
  await waitFor(() => expect(result.current.products).toHaveLength(10));
  expect(result.current.saved).toBe(false);
  expect(await store.readActive()).toBeNull();
});
test("pedido explícito salva todas as fotos", async () => {
  const { result } = renderHook(() => useCatalog(makeSourceStable, store));
  await waitFor(() => expect(result.current.products).toHaveLength(10));
  await act(() => result.current.prepareOffline());
  expect(result.current.saved).toBe(true);
  expect((await store.readActive())?.photos.size).toBe(10);
});
const makeSourceStable = makeSource(snapshotA);
test("sem rede e sem preparação apresenta orientação", async () => {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: false,
  });
  const { result } = renderHook(() => useCatalog(makeSourceStable, store));
  await waitFor(() => expect(result.current.message).toMatch(/internet/i));
  expect(result.current.products).toHaveLength(0);
});
test("armazenamento negado mantém catálogo online", async () => {
  store.readActive = async () => {
    throw new DOMException("Denied", "SecurityError");
  };
  const { result } = renderHook(() => useCatalog(makeSourceStable, store));
  await waitFor(() => expect(result.current.products).toHaveLength(10));
  expect(result.current.message).toMatch(/armazenamento/i);
});
test("carregamento lento tem estado visível", async () => {
  let resolve!: (value: typeof snapshotA) => void;
  const source = makeSource(snapshotA);
  source.getSnapshot = () =>
    new Promise((r) => {
      resolve = r;
    });
  const { result } = renderHook(() => useCatalog(source, store));
  await waitFor(() => expect(resolve).toBeDefined());
  expect(result.current.state).toBe("loading");
  await act(async () => resolve(snapshotA));
  expect(result.current.products).toHaveLength(10);
});
test("falha de atualização mantém cópia e aviso", async () => {
  const source = makeSource(snapshotA);
  const hook = renderHook(() => useCatalog(source, store));
  await waitFor(() => expect(hook.result.current.products).toHaveLength(10));
  await act(() => hook.result.current.prepareOffline());
  hook.unmount();
  const failing = makeSource(snapshotA);
  failing.getSnapshot = async () => {
    throw new Error("offline");
  };
  const { result } = renderHook(() => useCatalog(failing, store));
  await waitFor(() =>
    expect(result.current.message).toMatch(/Não foi possível atualizar/),
  );
  expect(result.current.products).toHaveLength(10);
  expect(result.current.saved).toBe(true);
});

test("notificação de outra aba preserva sincronização local pendente", async () => {
  const source = makeSource(snapshotA);
  const { result } = renderHook(() => useCatalog(source, store));
  await waitFor(() => expect(result.current.products).toHaveLength(10));
  await act(() => result.current.prepareOffline());
  // Outra aba já concluiu B; sua notificação pode chegar com atraso.
  await store.stagePhoto("other-tab", "photos/p0-v2.jpg", jpeg());
  await store.activate("other-tab", snapshotB, "2026-10-14T14:00:00.000Z");
  const snapshotC = {
    ...snapshotB,
    revision: 3,
    products: snapshotB.products.map((p, i) =>
      i === 0 ? { ...p, priceCents: 3500, imagePath: "photos/p0-v3.jpg" } : p,
    ),
  };
  source.getSnapshot = async () => snapshotC;
  source.getRevision = async () => 3;
  let release!: (value: Blob) => void;
  let entered = false;
  source.getPhoto = () => {
    entered = true;
    return new Promise<Blob>((resolve) => {
      release = resolve;
    });
  };
  let pending!: Promise<void>;
  await act(async () => {
    pending = result.current.prepareOffline();
  });
  await waitFor(() => expect(entered).toBe(true));
  const publisher = new BroadcastChannel("catalog-updates");
  try {
    publisher.postMessage("updated");
    await waitFor(() => expect(result.current.products).toHaveLength(9));
    expect(result.current.state).toBe("syncing");
    expect(result.current.message).not.toMatch(/Catálogo atualizado/);
  } finally {
    await act(async () => {
      release(jpeg());
      await pending;
    });
    publisher.close();
  }
  expect(result.current.products[0].priceCents).toBe(3500);
  expect(result.current.state).toBe("saved");
});
