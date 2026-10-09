import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Center, ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { LoadedModel, LoadingModel } from "./ViewerModel";

/**
 * Canvas viewer for an antique's GLB/GLTF model. This is the only way a 3D model is
 * shown: no generated or reconstructed meshes are rendered.
 */
export function ThreeDScene({ modelUrl }: { modelUrl: string }) {
  return <Canvas camera={{ position: [2.5, 2, 4], fov: 45, near: 0.01, far: 1000 }} dpr={[1, 2]}>
    <color attach="background" args={["#f4f1eb"]} />
    <ambientLight intensity={0.7} />
    <directionalLight position={[4, 6, 4]} intensity={2} />
    <directionalLight position={[-4, 2, -3]} intensity={0.8} />
    <Suspense fallback={<LoadingModel />}><Center><LoadedModel modelUrl={modelUrl} /></Center><Environment preset="studio" /></Suspense>
    <ContactShadows position={[0, -1, 0]} opacity={0.35} scale={10} blur={2} />
    <OrbitControls enableDamping dampingFactor={0.08} autoRotate autoRotateSpeed={1.5} minDistance={1} maxDistance={10} />
  </Canvas>;
}
