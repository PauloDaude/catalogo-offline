import { Download, RefreshCw, WifiOff, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SyncProgress } from "./types";

export function SyncStatus({
  saved,
  state,
  message,
  progress,
  onPrepare,
}: {
  saved: boolean;
  state: string;
  message: string;
  progress: SyncProgress | null;
  onPrepare: () => Promise<void>;
}) {
  const busy = state === "loading" || state === "syncing";

  return (
    <section
      aria-label="Disponibilidade do catálogo"
      className="sync-panel"
      data-compact={state === "online" && message === "Disponível online."}
    >
      <div className="sync-text">
        {state === "error" ? (
          <WifiOff aria-hidden="true" />
        ) : saved ? (
          <CheckCircle2 aria-hidden="true" />
        ) : (
          <Download aria-hidden="true" />
        )}
        <div>
          <p role="status">{message}</p>
          {progress?.phase === "downloading" && (
            <>
              <progress
                value={progress.completed}
                max={progress.total}
                aria-label="Fotos salvas"
              />
              <p className="sync-detail">
                {progress.completed} de {progress.total} fotos
              </p>
            </>
          )}
        </div>
      </div>
      <Button
        className="touch-button sync-button"
        variant={saved ? "outline" : "default"}
        isDisabled={busy}
        onPress={() => {
          void onPrepare();
        }}
      >
        {saved ? (
          <RefreshCw aria-hidden="true" />
        ) : (
          <Download aria-hidden="true" />
        )}
        {busy
          ? state === "loading"
            ? "Carregando…"
            : "Salvando…"
          : saved
            ? "Atualizar"
            : "Salvar offline"}
      </Button>
    </section>
  );
}
