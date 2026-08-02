'use client';

import { useRef, useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Html, OrbitControls, Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { CITIES } from '@/types';
import { ParticleField } from './ParticleField';

// Math to convert lat/long to 3D sphere coordinates
function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));
  
  return new THREE.Vector3(x, y, z);
}

const GLOBE_RADIUS = 2;

function EarthGlobe() {
  const groupRef = useRef<THREE.Group>(null);
  const router = useRouter();
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  // Load realistic daylight earth textures
  const [colorMap, bumpMap] = useTexture([
    'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    'https://unpkg.com/three-globe/example/img/earth-topology.png'
  ]);

  useFrame((state, delta) => {
    if (groupRef.current && !hoveredCity) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  const cityMarkers = useMemo(() => {
    return CITIES.map((city) => ({
      ...city,
      position: latLongToVector3(city.lat, city.lng, GLOBE_RADIUS),
    }));
  }, []);

  return (
    <>
      <group ref={groupRef} rotation={[0.2, -Math.PI / 2, 0]}>
        
        {/* Main Earth Sphere with Realistic Daylight Texture */}
        <Sphere args={[GLOBE_RADIUS, 64, 64]}>
          <meshStandardMaterial 
            map={colorMap} 
            bumpMap={bumpMap}
            bumpScale={0.05}
            metalness={0.1}
            roughness={0.8}
            emissive="#ffffff"
            emissiveIntensity={0.05}
          />
        </Sphere>

        {/* Subtle Realistic Atmosphere */}
        <Sphere args={[GLOBE_RADIUS * 1.02, 64, 64]}>
          <meshPhongMaterial
            color="#E0F2FE"
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </Sphere>

        {cityMarkers.map((city) => (
          <group 
            key={city.name} 
            position={[city.position.x, city.position.y, city.position.z]}
          >
            {/* Interactive City Dot */}
            <mesh 
              onPointerOver={(e) => { e.stopPropagation(); setHoveredCity(city.name); }}
              onPointerOut={(e) => { e.stopPropagation(); setHoveredCity(null); }}
              onClick={() => router.push(`/map?city=${city.name}`)}
            >
              <sphereGeometry args={[hoveredCity === city.name ? 0.08 : 0.04, 16, 16]} />
              <meshBasicMaterial color="#FF6B35" />
            </mesh>
            
            {/* Pulsing Aura */}
            <mesh scale={hoveredCity === city.name ? [1.5, 1.5, 1.5] : [1, 1, 1]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshBasicMaterial color="#FF6B35" transparent opacity={0.3} />
            </mesh>

            {/* Label Overlay */}
            {hoveredCity === city.name && (
              <Html distanceFactor={10} position={[0, 0.4, 0]} transform zIndexRange={[100, 0]}>
                <div className="bg-[var(--sidebar-bg)] border border-[var(--saffron)] px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap text-center pointer-events-none transform -translate-x-1/2 flex flex-col items-center">
                  <p className="text-white font-bold font-mukta text-sm leading-tight">{city.name.toUpperCase()}</p>
                  <p className="text-[var(--saffron)] font-bold text-[8px] animate-pulse mb-0.5">TEAM DISPATCHED</p>
                  <div className="flex gap-2">
                    <span className="text-gray-400 font-bold text-[7px] uppercase">Consequences Evaluated</span>
                    <span className="text-emerald-400 font-bold text-[7px] uppercase">GEE Status: Online</span>
                  </div>
                </div>
              </Html>
            )}
          </group>
        ))}
      </group>
    </>
  );
}

export default function GlobeScene() {
  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <pointLight position={[-10, 0, -10]} intensity={0.5} color="#f8fafc" />
        
        <Suspense fallback={<Html center><div className="text-[var(--saffron)] font-mukta animate-pulse">Mapping Reality...</div></Html>}>
          <ParticleField />
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <EarthGlobe />
          </Float>
        </Suspense>

        <OrbitControls 
          enablePan={false}
          enableZoom={false}
          rotateSpeed={0.5}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI - Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}
