'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Line, Float } from '@react-three/drei'
import * as random from 'maath/random'
import * as THREE from 'three'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NeuralNetwork(props: any) {
  const ref = useRef<THREE.Group>(null!)
  const pointsRef = useRef<THREE.Points>(null!)

  // Generate points
  const sphere = useMemo(() => random.inSphere(new Float32Array(300), { radius: 2.5 }), []) as Float32Array

  // Create connections
  const connections = useMemo(() => {
    const points = []
    for (let i = 0; i < sphere.length; i += 3) {
      const x = sphere[i]
      const y = sphere[i + 1]
      const z = sphere[i + 2]
      const v1 = new THREE.Vector3(x, y, z)

      // Find nearest neighbors
      for (let j = i + 3; j < sphere.length; j += 3) {
        const x2 = sphere[j]
        const y2 = sphere[j + 1]
        const z2 = sphere[j + 2]
        const v2 = new THREE.Vector3(x2, y2, z2)

        if (v1.distanceTo(v2) < 0.8) {
          points.push(v1)
          points.push(v2)
        }
      }
    }
    return points
  }, [sphere])

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 20
      ref.current.rotation.y -= delta / 25
    }
  })

  return (
    <group ref={ref} rotation={[0, 0, Math.PI / 4]} {...props}>
      <Points ref={pointsRef} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#6366f1" // Indigo-500
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.8}
        />
      </Points>
      <Line
        points={connections}
        color="#4f46e5" // Indigo-600
        opacity={0.1}
        transparent
        lineWidth={1}
      />
    </group>
  )
}

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 -z-10 bg-black">
      <Canvas camera={{ position: [0, 0, 3] }} gl={{ antialias: true, alpha: true }}>
        <fog attach="fog" args={['black', 1, 6]} />
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <NeuralNetwork />
        </Float>
      </Canvas>
    </div>
  )
}

export default AnimatedBackground

