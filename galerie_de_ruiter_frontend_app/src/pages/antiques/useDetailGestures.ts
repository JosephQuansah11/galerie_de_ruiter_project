import { useRef, useState, type PointerEvent } from "react";
import type { Position } from "./detailTypes";

export function useDetailGestures() {
  const [activeView, setActiveView] = useState<Position>("front");
  const start = useRef<{ x: number; y: number } | undefined>(undefined);
  const startDrag = (event: PointerEvent) => {
    start.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const endDrag = (event: PointerEvent) => {
    if (!start.current) return;
    const dx = event.clientX - start.current.x, dy = event.clientY - start.current.y;
    start.current = undefined;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) setActiveView((view) => view === "front" ? "back" : view === "back" ? "front" : view);
    else setActiveView(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "left" : "right" : dy > 0 ? "bottom" : "top");
  };
  return { activeView, setActiveView, startDrag, endDrag };
}
