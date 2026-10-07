import { useGLTF } from "@react-three/drei";

export function LoadingModel() {
  return <mesh><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial /></mesh>;
}

export function LoadedModel({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  return <primitive object={scene} dispose={null} />;
}
