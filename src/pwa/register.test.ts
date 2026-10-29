import { expect, test, vi } from "vitest";
import { ensureOfflineShell, OfflineShellError } from "./register";

test("desenvolvimento informa que é preciso abrir a versão de produção", async () => {
  vi.stubEnv("DEV", true);
  try {
    await expect(ensureOfflineShell()).rejects.toBeInstanceOf(
      OfflineShellError,
    );
    await expect(ensureOfflineShell()).rejects.toThrow("versão de produção");
  } finally {
    vi.unstubAllEnvs();
  }
});
