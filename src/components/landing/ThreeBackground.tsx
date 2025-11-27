'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Float } from '@react-three/drei'
import * as random from 'maath/random/dist/maath-random.esm'
import * as THREE from 'three'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ParticleField(props: any) {
  const ref = useRef<THREE.Points>(null!)
  const sphere = useMemo(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }), []) as Float32Array

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10
      ref.current.rotation.y -= delta / 15
    }
  })

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#4f46e5" // Indigo-600
          size={0.002}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  )
}

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 -z-10 bg-slate-950">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
          <ParticleField />
        </Float>
      </Canvas>
    </div>
  )
}

export default AnimatedBackground
