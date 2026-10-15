let registration: Promise<ServiceWorkerRegistration> | undefined;
export function registerAppShell() {
  if (
    !("serviceWorker" in navigator) ||
    !window.isSecureContext ||
    import.meta.env.DEV
  )
    return;
  if (!registration) {
    registration = navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((reg) => {
        const notify = () => {
          if (reg.waiting && navigator.serviceWorker.controller)
            window.dispatchEvent(new Event("catalog-app-update"));
        };
        notify();
        reg.addEventListener("updatefound", () =>
          reg.installing?.addEventListener("statechange", notify),
        );
        return reg;
      });
    registration.catch(() => {
      registration = undefined;
    });
  }
  return registration;
}
export async function ensureOfflineShell(): Promise<void> {
  const pending = registerAppShell();
  if (!pending)
    throw new Error(
      "A preparação offline exige acesso seguro e a versão de produção.",
    );
  await pending;
  await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(new Error("Não foi possível preparar o aplicativo offline")),
        15_000,
      ),
    ),
  ]);
  if (navigator.serviceWorker.controller) return;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        controlled,
      );
      reject(new Error("Aguarde a instalação e tente novamente"));
    }, 15_000);
    const controlled = () => {
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        controlled,
      );
      resolve();
    };
    navigator.serviceWorker.addEventListener("controllerchange", controlled);
    if (navigator.serviceWorker.controller) controlled();
  });
}
export async function requestAppUpdate(): Promise<void> {
  const reg = await registration;
  if (!reg?.waiting) return;
  navigator.serviceWorker.addEventListener(
    "controllerchange",
    () => window.location.reload(),
    { once: true },
  );
  reg.waiting.postMessage({ type: "SKIP_WAITING" });
}
