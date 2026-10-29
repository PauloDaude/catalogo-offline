import { useLayoutEffect, useRef, type ReactNode } from "react";
export function ProductListViewport({
  children,
  resetKey,
}: {
  children: ReactNode;
  resetKey: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [resetKey]);
  return (
    <div
      ref={ref}
      role="region"
      aria-label="Lista de produtos"
      tabIndex={0}
      className="admin-product-viewport"
    >
      {children}
    </div>
  );
}
