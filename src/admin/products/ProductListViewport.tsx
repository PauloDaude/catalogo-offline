import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
export function ProductListViewport({
  children,
  resetKey,
}: {
  children: ReactNode;
  resetKey: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  useLayoutEffect(() => {
    const region = ref.current;
    if (!region) return;
    const surface = region.closest(".admin-surface")!;
    let aligned = false;
    const update = () => {
      const pagination = surface.querySelector(".admin-pagination");
      const controls = surface.querySelector(".admin-list-controls");
      const viewport = window.visualViewport?.height ?? window.innerHeight;
      const footerStyle = pagination ? getComputedStyle(pagination) : undefined;
      const reserve =
        (pagination?.getBoundingClientRect().height ?? 48) +
        (parseFloat(footerStyle?.marginTop || "0") || 0) +
        (parseFloat(getComputedStyle(surface).paddingBottom) || 0) +
        12;
      const minimum = 64;
      if (
        !aligned &&
        controls &&
        controls.getBoundingClientRect().height > 0 &&
        region.getBoundingClientRect().top + minimum + reserve > viewport
      ) {
        aligned = true;
        controls.scrollIntoView({ block: "start", behavior: "instant" });
      }
      setHeight(
        Math.max(
          minimum,
          Math.min(
            640,
            viewport - region.getBoundingClientRect().top - reserve,
          ),
        ),
      );
    };
    update();
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(update)
        : undefined;
    for (const child of surface.children)
      if (child !== region) observer?.observe(child);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);
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
      style={{ maxHeight: height }}
    >
      {children}
    </div>
  );
}
