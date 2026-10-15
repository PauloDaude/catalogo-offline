import { useRef, useState, type PointerEvent } from "react";

export function useSwipeNavigation(onNext: () => void, onPrevious: () => void) {
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    dragging: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const [offset, setOffset] = useState(0);

  function reset() {
    gesture.current = null;
    setOffset(0);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      !event.currentTarget.contains(event.target as Node)
    )
      return;

    suppressClick.current = false;
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      dragging: false,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start || event.pointerId !== start.id) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      start.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      if (event.cancelable) event.preventDefault();
      setOffset(Math.max(-160, Math.min(160, dx)) / 4);
    }
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start || event.pointerId !== start.id) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (start.dragging) {
      suppressClick.current = true;
      if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        if (dx > 0) onNext();
        else onPrevious();
      }
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);
    }
    reset();
  }

  return {
    offset,
    handlers: {
      // Capture before the product button consumes press events.
      onPointerDownCapture: onPointerDown,
      onPointerMoveCapture: onPointerMove,
      onPointerUpCapture: onPointerUp,
      onPointerCancelCapture: reset,
      onClickCapture(event: React.MouseEvent<HTMLDivElement>) {
        if (suppressClick.current && event.detail !== 0) {
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }
      },
    },
  };
}
