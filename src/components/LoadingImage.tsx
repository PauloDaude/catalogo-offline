import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";

export function LoadingImage({
  src,
  className = "",
  onLoad,
  onError,
  ...props
}: ComponentPropsWithoutRef<"img">) {
  const image = useRef<HTMLImageElement>(null);
  const [settled, setSettled] = useState<string>();
  useEffect(() => {
    if (image.current?.complete) setSettled(src);
  }, [src]);
  return (
    <img
      {...props}
      ref={image}
      src={src}
      className={`loading-image ${className}`}
      data-loading={src && settled !== src ? true : undefined}
      onLoad={(event) => {
        setSettled(src);
        onLoad?.(event);
      }}
      onError={(event) => {
        setSettled(src);
        onError?.(event);
      }}
    />
  );
}
