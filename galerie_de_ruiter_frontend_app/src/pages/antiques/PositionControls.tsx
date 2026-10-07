import { Button } from "@/components/ReactButton";
import type { Position, Translate } from "./detailTypes";

export function PositionControls({ positions, activeView, select, t }: {
  positions: Position[]; activeView: Position; select: (position: Position) => void; t: Translate;
}) {
  return <div className="cube-view-controls">{positions.map((position) =>
    <Button key={position} type="button" className={`btn btn-${activeView === position ? "dark" : "outline-secondary"}`}
      onClick={() => select(position)}>{t(`position${position[0].toUpperCase()}${position.slice(1)}`)}</Button>)}</div>;
}
