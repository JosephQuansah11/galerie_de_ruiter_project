import type { PointerEvent } from "react";
import type { Position, Translate } from "./detailTypes";

type Props = { activeImage: string; activeView: Position; title: string; startDrag: (event: PointerEvent) => void;
  endDrag: (event: PointerEvent) => void; t: Translate };
export function CubeView({ activeImage, activeView, title, startDrag, endDrag, t }: Props) {
  const label = `position${activeView[0].toUpperCase()}${activeView.slice(1)}`;
  return <div className="image-cube-viewer" onPointerDown={startDrag} onPointerUp={endDrag}>
    <img className="cube-active-image" src={activeImage} alt={`${activeView} view of ${title}`} />
    <span className="cube-view-label">{t(label)}</span>
  </div>;
}
