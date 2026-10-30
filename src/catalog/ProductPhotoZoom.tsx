import { LoadingImage } from "../components/LoadingImage";
import { useId, useRef, useState, type PointerEvent } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "../components/ui/button";

type View = { scale: number; x: number; y: number };
type Point = { x: number; y: number };
const initial: View = { scale: 1, x: 0, y: 0 };
const distance = (points: Point[]) =>
  Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);

export function ProductPhotoZoom({ src, name }: { src: string; name: string }) {
  const [view, setView] = useState(initial);
  const stage = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<{ distance: number; scale: number } | null>(null);
  const instruction = useId();

  function bounded(next: View): View {
    const scale = Math.max(1, Math.min(4, next.scale));
    const maxX = ((stage.current?.clientWidth || 0) * (scale - 1)) / 2;
    const maxY = ((stage.current?.clientHeight || 0) * (scale - 1)) / 2;
    return {
      scale,
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    };
  }
  function zoom(delta: number) {
    setView((current) => bounded({ ...current, scale: current.scale + delta }));
  }
  function start(event: PointerEvent<HTMLDivElement>) {
    if (
      event.button !== 0 ||
      pointers.current.size >= 2 ||
      (event.pointerType !== "touch" && view.scale <= 1)
    )
      return;
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (event.pointerType === "touch" || view.scale > 1)
      event.currentTarget.setPointerCapture(event.pointerId);
    if (pointers.current.size === 2)
      pinch.current = {
        distance: distance([...pointers.current.values()]),
        scale: view.scale,
      };
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (
      pointers.current.size === 2 &&
      pinch.current &&
      pinch.current.distance > 0
    ) {
      const scale =
        (pinch.current.scale * distance([...pointers.current.values()])) /
        pinch.current.distance;
      setView((current) => bounded({ ...current, scale }));
    } else if (view.scale > 1) {
      setView((current) =>
        bounded({
          ...current,
          x: current.x + event.clientX - previous.x,
          y: current.y + event.clientY - previous.y,
        }),
      );
    }
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    pinch.current = null;
  }

  return (
    <>
      <div
        ref={stage}
        className="product-photo-stage"
        aria-describedby={instruction}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
        data-zoomed={view.scale > 1 || undefined}
      >
        <LoadingImage
          src={src}
          alt={name}
          className="product-photo-full"
          draggable={false}
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          }}
        />
      </div>
      <div
        className="product-photo-zoom-controls"
        role="group"
        aria-label="Zoom da foto"
      >
        <Button
          variant="outline"
          className="touch-button"
          aria-label="Afastar foto"
          isDisabled={view.scale <= 1}
          onPress={() => zoom(-0.5)}
        >
          <Minus aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          className="touch-button"
          aria-label="Restaurar tamanho da foto"
          onPress={() => setView(initial)}
        >
          {Math.round(view.scale * 100)}%
        </Button>
        <Button
          variant="outline"
          className="touch-button"
          aria-label="Aproximar foto"
          isDisabled={view.scale >= 4}
          onPress={() => zoom(0.5)}
        >
          <Plus aria-hidden="true" />
        </Button>
      </div>
      <p
        id={instruction}
        className="sr-only"
      >
        Use dois dedos para ampliar e arraste a foto para ver os detalhes, ou
        use os botões de zoom
      </p>
    </>
  );
}
