"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Database, Shield, Zap, TrendingUp } from "lucide-react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Sphere, MeshDistortMaterial, Environment } from "@react-three/drei"
import { useRef, useEffect, useState, Suspense } from "react"
import type * as THREE from "three"
import { useRouter } from "next/navigation"

// Stable Animated 3D Sphere
function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useFrame((state) => {
    if (meshRef.current && mounted) {
      // Use stable rotation that doesn't accumulate errors
      const time = state.clock.elapsedTime
      meshRef.current.rotation.x = Math.sin(time * 0.2) * 0.1 + time * 0.1
      meshRef.current.rotation.y = Math.cos(time * 0.15) * 0.1 + time * 0.15
      
      // Add gentle floating motion
      meshRef.current.position.y = Math.sin(time * 0.5) * 0.1
    }
  })

  if (!mounted) return null

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} scale={2}>
      <MeshDistortMaterial
        color="#8b5cf6"
        attach="material"
        distort={0.3}
        speed={1.2}
        roughness={0.3}
        metalness={0.7}
        transparent
        opacity={0.9}
      />
    </Sphere>
  )
}

// Fallback loading component
function SphereFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 animate-pulse" />
    </div>
  )
}

// Hero Section with stable 3D integration
export function HeroSection() {
  const router = useRouter()
  const [canvasKey, setCanvasKey] = useState(0)
  const [is3DReady, setIs3DReady] = useState(false)

  // Handle page visibility changes to prevent 3D corruption
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setCanvasKey(prev => prev + 1)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Delay 3D rendering for stability
    const timer = setTimeout(() => setIs3DReady(true), 100)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearTimeout(timer)
    }
  }, [])

  const handleNavigation = (path: string) => {
    router.push(path)
  }

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
                onClick={() => handleNavigation("/tenders")}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
              >
                Start Selling Data
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => handleNavigation("/search")}
                size="lg"
                variant="outline"
                className="border-border hover:bg-accent bg-transparent transition-all duration-300"
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

          {/* Right side 3D Sphere with stability fixes */}
          <div className="relative h-[500px] lg:h-[600px]">
            {is3DReady ? (
              <Canvas 
                key={canvasKey}
                camera={{ position: [0, 0, 5], fov: 60 }}
                gl={{ 
                  antialias: true, 
                  alpha: true,
                  powerPreference: "high-performance" 
                }}
                dpr={[1, 2]}
                onCreated={(state) => {
                  state.gl.setClearColor('#000000', 0)
                }}
              >
                <Suspense fallback={null}>
                  <ambientLight intensity={0.4} />
                  <pointLight position={[10, 10, 10]} intensity={0.8} />
                  <pointLight position={[-10, -10, -5]} intensity={0.3} color="#8b5cf6" />
                  
                  <AnimatedSphere />
                  
                  <Environment preset="night" />
                  <OrbitControls 
                    enableZoom={false} 
                    enablePan={false}
                    autoRotate 
                    autoRotateSpeed={0.3}
                    dampingFactor={0.1}
                    enableDamping
                    maxPolarAngle={Math.PI}
                    minPolarAngle={0}
                  />
                </Suspense>
              </Canvas>
            ) : (
              <SphereFallback />
            )}

            {/* Floating data elements with improved animations */}
            <div className="absolute top-20 left-10 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
                <Database className="w-5 h-5 text-primary mb-1" />
                <div className="text-xs text-muted-foreground">Consumer Data</div>
              </div>
            </div>

            <div className="absolute top-40 right-10 animate-bounce" style={{ animationDelay: "1s", animationDuration: '3s' }}>
              <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
                <TrendingUp className="w-5 h-5 text-accent mb-1" />
                <div className="text-xs text-muted-foreground">Market Analytics</div>
              </div>
            </div>

            <div className="absolute bottom-32 left-20 animate-bounce" style={{ animationDelay: "2s", animationDuration: '3s' }}>
              <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
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