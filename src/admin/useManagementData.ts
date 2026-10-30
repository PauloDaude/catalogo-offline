import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminApi } from "./api";
import type { AdminCategory, AdminProduct, ProductQuery } from "./types";

export function useManagementData(
  api: AdminApi,
  filters: ProductQuery,
  setPage: (page: number) => void,
) {
  const [data, setData] = useState<{
    products: AdminProduct[];
    categories: AdminCategory[];
    total: number;
  }>({ products: [], categories: [], total: 0 });
  const [debouncedQuery, setDebouncedQuery] = useState(filters.query);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadedKey, setLoadedKey] = useState("");
  const request = useRef(0);
  const { page, category, visibility, query } = filters;
  const key = JSON.stringify([page, category, visibility, debouncedQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const refresh = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    setError("");
    try {
      const [result, categories] = await Promise.all([
        api.listProducts({ page, query: debouncedQuery, category, visibility }),
        api.listCategories(),
      ]);
      if (id !== request.current) return;
      const last = Math.max(1, Math.ceil(result.total / 20));
      if (page > last) {
        setPage(last);
        return;
      }
      setData({ ...result, categories });
      setLoadedKey(key);
    } catch (err) {
      if (id === request.current)
        setError(
          "Não foi possível carregar, confira sua conexão ou a configuração do banco",
        );
      throw err;
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [api, page, debouncedQuery, category, visibility, key, setPage]);

  useEffect(() => {
    void refresh().catch(() => {});
    return () => {
      request.current++;
    };
  }, [refresh]);

  return {
    data,
    initialized: loadedKey !== "",
    hasCurrentData: loadedKey === key && query === debouncedQuery,
    refreshing: loading && loadedKey === key && query === debouncedQuery,
    refresh,
    error,
    setError,
    loading:
      loading || query !== debouncedQuery || (!error && loadedKey !== key),
  };
}
