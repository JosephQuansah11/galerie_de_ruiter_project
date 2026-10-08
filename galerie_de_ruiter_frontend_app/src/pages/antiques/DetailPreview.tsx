import { ThreeDModelDesigner } from "@/3dmodel/three-d/ThreeDModelDesigner";
import type { ReconstructionJob } from "@/apis/reconstruction_api";
import type { Position, Translate } from "./detailTypes";
import { CubeView } from "./CubeView";
import { PositionControls } from "./PositionControls";

type Props = { title: string; modelUrl?: string; frontImage?: string | File; activeImage?: string; activeView: Position;
  viewsAvailable: boolean; positions: Position[]; t: Translate;
  startDrag: React.PointerEventHandler; endDrag: React.PointerEventHandler;
  selectView: (position: Position) => void };
export function DetailPreview(props: Props) {
  return <div className="model-preview">
    {props.modelUrl && <ThreeDModelDesigner title={props.title} modelUrl={props.modelUrl} frontImage={props.frontImage} />}
    {!props.modelUrl && props.viewsAvailable && props.activeImage && <CubeView activeImage={props.activeImage} activeView={props.activeView}
      title={props.title} startDrag={props.startDrag} endDrag={props.endDrag} t={props.t} />}
    {!props.modelUrl && !props.viewsAvailable && <><span>{props.t("threeDPreview")}</span><strong>{props.t("modelComingSoon")}</strong><p>{props.t("modelDescription")}</p></>}
    {!props.modelUrl && props.viewsAvailable && <PositionControls positions={props.positions} activeView={props.activeView} select={props.selectView} t={props.t} />}
  </div>;
}
