import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, useProgress } from '@react-three/drei';

// Preload models ONLY when they are actually needed (lazy loaded by React Fiber)
// NOTE: For production, replace the placeholder meshes with actual `useGLTF('/models/...glb')`
// Example usage:
// const { scene } = useGLTF('/models/case.glb');
// return <primitive object={scene} />;

const CaseModel = () => {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[3, 5, 5]} />
      <meshStandardMaterial color="#1f2937" transparent opacity={0.6} />
    </mesh>
  );
};

const MotherboardModel = () => {
  return (
    <mesh position={[-1.4, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      <boxGeometry args={[4.5, 4.5, 0.1]} />
      <meshStandardMaterial color="#374151" />
    </mesh>
  );
};

const CpuModel = () => {
  return (
    <mesh position={[-1.3, 1.5, -0.5]} rotation={[0, Math.PI / 2, 0]}>
      <boxGeometry args={[0.5, 0.5, 0.05]} />
      <meshStandardMaterial color="#e5e7eb" />
    </mesh>
  );
};

const GpuModel = () => {
  return (
    <mesh position={[-1.0, -0.5, 0.5]} rotation={[0, 0, 0]}>
      <boxGeometry args={[1, 3, 0.4]} />
      <meshStandardMaterial color="#111827" />
    </mesh>
  );
};

const RamModel = () => {
  return (
    <mesh position={[-1.3, 1.5, 0.5]} rotation={[0, 0, 0]}>
      <boxGeometry args={[0.1, 1.2, 0.4]} />
      <meshStandardMaterial color="#9ca3af" />
    </mesh>
  );
};

const PsuModel = () => {
  return (
    <mesh position={[-0.5, -2, -1.5]} rotation={[0, 0, 0]}>
      <boxGeometry args={[1.5, 1.5, 2]} />
      <meshStandardMaterial color="#1f2937" />
    </mesh>
  );
};

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#1E6FE8] border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-[#1A1A1A] font-bold">{progress.toFixed(0)}% Loaded</div>
      </div>
    </Html>
  );
}

interface PCSceneProps {
  config: Record<string, any>;
}

export default function PCScene({ config }: PCSceneProps) {
  return (
    <Canvas camera={{ position: [6, 4, 8], fov: 45 }} shadows={false}>
      {/* Optimized lighting: No shadows, simple ambient + directional */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      
      {/* Static Camera - disabled pan and zoom for performance */}
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />

      <Suspense fallback={<Loader />}>
        {/* Render models ONLY if they exist in config */}
        {config.case && <CaseModel />}
        {config.motherboard && <MotherboardModel />}
        {config.cpu && <CpuModel />}
        {config.gpu && <GpuModel />}
        {config.ram && <RamModel />}
        {config.psu && <PsuModel />}
      </Suspense>
    </Canvas>
  );
}
