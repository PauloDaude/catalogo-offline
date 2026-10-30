import type { ReactNode } from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton ${className}`}
    />
  );
}

export function SkeletonRegion({
  label,
  className = "",
  children,
  announce = true,
}: {
  label: string;
  className?: string;
  children: ReactNode;
  announce?: boolean;
}) {
  return (
    <div
      role={announce ? "status" : undefined}
      aria-busy="true"
      className={`skeleton-region ${className}`}
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

function Lines() {
  return (
    <div className="skeleton-lines">
      <Skeleton className="skeleton-line" />
      <Skeleton className="skeleton-line skeleton-short" />
      <Skeleton className="skeleton-price" />
    </div>
  );
}

export function CatalogSkeleton({ book }: { book: boolean }) {
  return (
    <SkeletonRegion
      label="Carregando catálogo…"
      announce={false}
      className={book ? "skeleton-book" : "skeleton-grid"}
    >
      {book ? (
        <div className="skeleton-book-product">
          <Skeleton className="skeleton-book-photo" />
          <div className="skeleton-book-caption">
            <Lines />
          </div>
          <Skeleton className="skeleton-navigation" />
        </div>
      ) : (
        <div className="product-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              className="skeleton-card"
              key={i}
            >
              <Skeleton className="skeleton-card-photo" />
              <Lines />
            </div>
          ))}
        </div>
      )}
    </SkeletonRegion>
  );
}

export function AdminListSkeleton({
  categories = false,
}: {
  categories?: boolean;
}) {
  return (
    <SkeletonRegion
      label={categories ? "Carregando categorias…" : "Carregando produtos…"}
      className="skeleton-admin-list"
    >
      {Array.from({ length: categories ? 4 : 6 }, (_, i) => (
        <div
          className="skeleton-admin-row"
          key={i}
        >
          {!categories && <Skeleton className="skeleton-admin-photo" />}
          <Lines />
          <Skeleton className="skeleton-action" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

export function AccessSkeleton({
  label = "Conferindo acesso…",
}: {
  label?: string;
}) {
  return (
    <SkeletonRegion
      label={label}
      className="admin-surface skeleton-access"
    >
      <Skeleton className="skeleton-title" />
      <Skeleton className="skeleton-line" />
      <Skeleton className="skeleton-field" />
      <Skeleton className="skeleton-field" />
      <Skeleton className="skeleton-field" />
    </SkeletonRegion>
  );
}

export function DocumentSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion
      label={label}
      className="skeleton-document"
    >
      <Skeleton className="skeleton-document-page" />
      <Lines />
    </SkeletonRegion>
  );
}
