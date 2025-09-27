"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Float, Sphere } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Shield, CheckCircle, Wallet, ArrowRight } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"

function LoginScene() {
  return (
    <>
      <Environment preset="night" />
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.4} color="#6366f1" />
      <pointLight position={[-10, -10, -10]} intensity={0.2} color="#10b981" />

      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
        <Sphere args={[0.8, 32, 32]} position={[-3, 2, -2]}>
          <meshStandardMaterial color="#6366f1" transparent opacity={0.2} wireframe />
        </Sphere>
      </Float>

      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.6}>
        <Sphere args={[0.4, 16, 16]} position={[3, -1, -1]}>
          <meshStandardMaterial color="#10b981" transparent opacity={0.3} emissive="#10b981" emissiveIntensity={0.1} />
        </Sphere>
      </Float>

      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.5}>
        <Sphere args={[0.6, 20, 20]} position={[0, 3, -3]}>
          <meshStandardMaterial
            color="#9333ea"
            transparent
            opacity={0.25}
            emissive="#9333ea"
            emissiveIntensity={0.15}
          />
        </Sphere>
      </Float>

      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
    </>
  )
}

export default function LoginPage() {
  const { account, isConnected, connectWallet, isConnecting } = useWallet()
  const router = useRouter()

  useEffect(() => {
    if (isConnected && account) {
      // Small delay to show the success state
      const timer = setTimeout(() => {
        router.push("/")
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isConnected, account, router])

  const handleConnectWallet = async () => {
    try {
      await connectWallet()
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* 3D Background Scene */}
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <LoginScene />
        </Canvas>
      </div>

      {/* Animated particles */}
      <div className="fixed inset-0 z-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center pulse-glow">
              <Database className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">DataVault</h1>
            <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">
              Beta
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg">Welcome back to the future of data monetization</p>
        </div>

        {/* Main Card */}
        <Card className="glass w-full max-w-md float-animation">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold mb-2">
              {isConnected ? "Welcome Back!" : "Login to DataVault"}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {isConnected
                ? "Your wallet is connected and verified. Redirecting to dashboard..."
                : "Connect your wallet to access your account and start trading data"}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {isConnected && account ? (
              <div className="space-y-4">
                <div className="glass p-4 rounded-lg border border-emerald-500/30 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-emerald-400 font-semibold mb-2">Wallet Connected Successfully!</p>
                  <p className="text-xs text-emerald-400/80 font-mono break-all">{account}</p>
                </div>

                <Button
                  onClick={() => router.push("/")}
                  className="w-full py-4 text-base font-semibold bg-gradient-to-r from-emerald-500 to-primary hover:from-emerald-600 hover:to-primary/90 transition-all duration-300"
                >
                  <ArrowRight className="mr-3 w-5 h-5" />
                  Continue to Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="w-full py-4 text-base font-medium bg-primary hover:bg-primary/90 pulse-glow transition-all duration-300"
                >
                  <Wallet className="mr-3 w-5 h-5" />
                  {isConnecting ? "Connecting..." : "Connect MetaMask Wallet"}
                </Button>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">Don't have an account?</p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/signup")}
                    className="glass border-accent/30 hover:bg-accent/10 bg-transparent"
                  >
                    Create New Account
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
          <div className="glass p-4 rounded-lg text-center">
            <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Secure Login</h3>
            <p className="text-xs text-muted-foreground">Wallet-based authentication</p>
          </div>
          <div className="glass p-4 rounded-lg text-center">
            <Database className="w-8 h-8 text-accent mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Decentralized</h3>
            <p className="text-xs text-muted-foreground">No passwords required</p>
          </div>
          <div className="glass p-4 rounded-lg text-center">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Verified</h3>
            <p className="text-xs text-muted-foreground">Blockchain verified identity</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Secure blockchain-based authentication • No personal data stored</p>
        </div>
      </div>
    </div>
  )
}
