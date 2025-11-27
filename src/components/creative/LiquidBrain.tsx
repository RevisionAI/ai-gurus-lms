'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei'
import * as THREE from 'three'

function DistortedSphere() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const materialRef = useRef<any>(null)

    useFrame(({ clock, mouse }) => {
        if (materialRef.current) {
            // Animate distortion based on time
            materialRef.current.distort = 0.4 + Math.sin(clock.getElapsedTime()) * 0.1

            // Subtle color shift based on mouse position
            // materialRef.current.color.setHSL(0.6 + mouse.x * 0.1, 0.8, 0.5)
        }
    })

    return (
        <Sphere args={[1, 64, 64]} scale={2}>
            <MeshDistortMaterial
                ref={materialRef}
                color="#4338ca" // Indigo-700
                envMapIntensity={1}
                clearcoat={1}
                clearcoatRoughness={0}
                metalness={0.1}
                roughness={0.2}
                distort={0.4}
                speed={2}
            />
        </Sphere>
    )
}

export default function LiquidBrain() {
    return (
        <div className="absolute inset-0 -z-10 h-screen w-full overflow-hidden">
            <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-10, -10, -5]} intensity={1} color="#818cf8" />
                <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                    <DistortedSphere />
                </Float>
            </Canvas>
        </div>
    )
}
