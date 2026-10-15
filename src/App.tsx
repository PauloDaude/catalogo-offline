import { useEffect, useState } from "react";

import { createHttpSource } from "./catalog/source";
import { CatalogPage } from "./catalog/CatalogPage";
import { useCatalog } from "./catalog/useCatalog";
import { createCatalogStore } from "./catalog/storage";
import { SyncStatus } from "./catalog/SyncStatus";
import { Button } from "./components/ui/button";
import { registerAppShell, requestAppUpdate } from "./pwa/register";

const source = createHttpSource(import.meta.env.BASE_URL);

const store = createCatalogStore("catalogo-offline");

export default function App() {
  const catalog = useCatalog(source, store);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const notify = () => setUpdateAvailable(true);
    window.addEventListener("catalog-app-update", notify);
    void registerAppShell()?.catch(() => {});

    return () => window.removeEventListener("catalog-app-update", notify);
  }, []);

  return (
    <CatalogPage
      products={catalog.products}
      images={catalog.images}
      catalogReady={catalog.snapshot !== undefined}
    >
      <SyncStatus
        {...catalog}
        onPrepare={catalog.prepareOffline}
      />
      {updateAvailable && (
        <div className="app-update">
          <span>Nova versão disponível</span>
          <Button
            variant="outline"
            className="touch-button"
            isDisabled={catalog.state === "syncing"}
            onPress={() => {
              void requestAppUpdate();
            }}
          >
            Reabrir atualizado
          </Button>
        </div>
      )}
    </CatalogPage>
  );
}
