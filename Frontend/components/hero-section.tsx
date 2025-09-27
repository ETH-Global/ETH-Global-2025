"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Database, Shield, Zap, TrendingUp } from "lucide-react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Sphere, MeshDistortMaterial, Environment } from "@react-three/drei"
import { useRef } from "react"
import type * as THREE from "three"
import { useRouter } from "next/navigation"  // ✅ Correct import for App Router

// Animated 3D Sphere
function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <Sphere ref={meshRef} args={[1, 100, 200]} scale={2}>
      <MeshDistortMaterial
        color="#8b5cf6"
        attach="material"
        distort={0.3}
        speed={1.5}
        roughness={0.4}
        metalness={0.8}
      />
    </Sphere>
  )
}

// Hero Section
export function HeroSection() {
  const router = useRouter()

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <Zap className="w-3 h-3 mr-2" />
                Powered by Ethereum Blockchain
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-balance">
                Monetize Your <span className="gradient-text">Data Assets</span> on the Blockchain
              </h1>

              <p className="text-xl text-muted-foreground text-pretty max-w-2xl">
                Transform your valuable data into revenue streams. Connect with enterprises seeking premium datasets
                through our secure, decentralized marketplace.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => router.push("/tenders")}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Start Selling Data
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => router.push("/search")}
                size="lg"
                variant="outline"
                className="border-border hover:bg-accent bg-transparent"
              >
                Personalize Search
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">$2.4M+</div>
                <div className="text-sm text-muted-foreground">Total Volume</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">1,200+</div>
                <div className="text-sm text-muted-foreground">Data Providers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-chart-3">450+</div>
                <div className="text-sm text-muted-foreground">Enterprise Buyers</div>
              </div>
            </div>
          </div>

          {/* Right side 3D Sphere */}
          <div className="relative h-[500px] lg:h-[600px]">
            <Canvas camera={{ position: [0, 0, 5] }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <AnimatedSphere />
              <Environment preset="night" />
              <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>

            {/* Floating data elements */}
            <div className="absolute top-20 left-10 float-animation">
              <div className="bg-card border border-border rounded-lg p-3 backdrop-blur-sm">
                <Database className="w-5 h-5 text-primary mb-1" />
                <div className="text-xs text-muted-foreground">Consumer Data</div>
              </div>
            </div>

            <div className="absolute top-40 right-10 float-animation" style={{ animationDelay: "1s" }}>
              <div className="bg-card border border-border rounded-lg p-3 backdrop-blur-sm">
                <TrendingUp className="w-5 h-5 text-accent mb-1" />
                <div className="text-xs text-muted-foreground">Market Analytics</div>
              </div>
            </div>

            <div className="absolute bottom-32 left-20 float-animation" style={{ animationDelay: "2s" }}>
              <div className="bg-card border border-border rounded-lg p-3 backdrop-blur-sm">
                <Shield className="w-5 h-5 text-chart-3 mb-1" />
                <div className="text-xs text-muted-foreground">Secure Transfer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
