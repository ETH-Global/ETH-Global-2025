"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Shield, CheckCircle, Wallet, Zap, ArrowLeft, QrCode, Sparkles, Lock, Globe } from "lucide-react"
import SelfQR from "@/components/self-qr"
import { useRouter } from "next/navigation"

const Canvas = dynamic(() => import("@react-three/fiber").then((mod) => mod.Canvas), {
  ssr: false,
})

const SignupScene = dynamic(() => import("./signup-scene"), {
  ssr: false,
})

function ParticleField() {
  const [particles, setParticles] = useState<
    Array<{ id: number; left: number; top: number; delay: number; duration: number; size: number }>
  >([])

  useEffect(() => {
    const particleArray = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 4,
      size: 1 + Math.random() * 2,
    }))
    setParticles(particleArray)
  }, [])

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute bg-gradient-to-br from-primary/40 to-accent/30 rounded-full animate-pulse"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            filter: 'blur(0.5px)',
          }}
        />
      ))}
      
      {/* Floating gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
  )
}

function FloatingIcons() {
  const icons = [
    { Icon: Database, delay: 0, x: 10, y: 20 },
    { Icon: Shield, delay: 1, x: 85, y: 15 },
    { Icon: Zap, delay: 2, x: 15, y: 80 },
    { Icon: Globe, delay: 1.5, x: 90, y: 75 },
    { Icon: Lock, delay: 0.5, x: 5, y: 50 },
  ]

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {icons.map(({ Icon, delay, x, y }, index) => (
        <div
          key={index}
          className="absolute opacity-10 animate-bounce"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            animationDelay: `${delay}s`,
            animationDuration: '3s',
          }}
        >
          <Icon className="w-8 h-8 text-primary" />
        </div>
      ))}
    </div>
  )
}

export default function SignupForm() {
  const [address, setAddress] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [selfAuthDone, setSelfAuthDone] = useState<boolean>(false)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [showQR, setShowQR] = useState<boolean>(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const connectWallet = async (): Promise<void> => {
    if (typeof window.ethereum === "undefined") {
      setStatus("MetaMask not detected. Please install MetaMask to continue.")
      return
    }

    setIsConnecting(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any)
      const accounts: string[] = await provider.send("eth_requestAccounts", [])
      setAddress(accounts[0])
      setStatus("Wallet connected successfully! ✨")
    } catch (err) {
      console.error(err)
      setStatus("Failed to connect wallet. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleVerifyIdentity = (): void => {
    if (!address) {
      setStatus("⚠️ Please connect your wallet first.")
      return
    }
    setShowQR(true)
    setStatus("Scan the QR code to verify your identity 📱")
  }

  const handleSelfAuth = (): void => {
    setSelfAuthDone(true)
    setShowQR(false)
    setStatus("Identity verification completed! 🔐")
  }

  const handleSignup = (): void => {
    if (!address) {
      setStatus("⚠️ Please connect your MetaMask wallet first.")
      return
    }
    if (!selfAuthDone) {
      setStatus("⚠️ Please complete identity verification.")
      return
    }
    console.log("Signing up with:", { address, selfAuthDone })
    setStatus("🎉 Welcome to DataVault! Redirecting to login...")

    setTimeout(() => {
      router.push("/login")
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 text-foreground overflow-hidden relative">
      {/* Enhanced Background Effects */}
      {mounted && (
        <div className="fixed inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
            <SignupScene />
          </Canvas>
        </div>
      )}

      {mounted && <ParticleField />}
      {mounted && <FloatingIcons />}
      
      {/* Animated grid background */}
      <div className="fixed inset-0 z-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24px,rgba(255,255,255,0.05)_25px,rgba(255,255,255,0.05)_26px,transparent_27px,transparent_74px,rgba(255,255,255,0.05)_75px,rgba(255,255,255,0.05)_76px,transparent_77px,transparent_100%),linear-gradient(rgba(255,255,255,0.05)_24px,transparent_25px,transparent_26px,rgba(255,255,255,0.05)_27px,rgba(255,255,255,0.05)_74px,transparent_75px,transparent_76px,rgba(255,255,255,0.05)_77px,rgba(255,255,255,0.05)_100%)] bg-[length:100px_100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Enhanced Header */}
        <div className="text-center mb-12 transform hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-primary via-accent to-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <Database className="w-9 h-9 text-white drop-shadow-lg" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-emerald-500 rounded-2xl blur-xl opacity-30 animate-pulse" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-emerald-400 bg-clip-text text-transparent">
                DataVault
              </h1>
              <Badge variant="secondary" className="bg-gradient-to-r from-accent/20 to-primary/20 text-accent border-accent/30 mt-2">
                <Sparkles className="w-3 h-3 mr-1" />
                Beta
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground text-xl max-w-md mx-auto leading-relaxed">
            Join the future of <span className="text-primary font-semibold">data monetization</span> on the blockchain
          </p>
        </div>

        {/* Enhanced Main Card */}
        <Card className="backdrop-blur-xl bg-background/40 border-primary/20 shadow-2xl w-full max-w-lg transform hover:scale-[1.02] transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 rounded-lg" />
          
          <CardHeader className="relative text-center pb-6">
            <CardTitle className="text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Create Account
            </CardTitle>
            <p className="text-muted-foreground leading-relaxed">
              Connect your wallet and start selling your valuable data on the blockchain
            </p>
          </CardHeader>

          <CardContent className="relative space-y-8">
            {/* Wallet Connection */}
            <div className="space-y-4">
              <Button
                onClick={connectWallet}
                disabled={isConnecting || !!address}
                className={`w-full py-6 text-lg font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg ${
                  address
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-emerald-500/25"
                    : "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-primary/25"
                }`}
              >
                <Wallet className="mr-3 w-6 h-6" />
                {isConnecting ? "Connecting..." : address ? "Wallet Connected" : "Connect MetaMask"}
                {address && <CheckCircle className="ml-3 w-6 h-6" />}
              </Button>

              {address && (
                <div className="backdrop-blur-sm bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
                  <p className="text-sm font-mono break-all text-emerald-400 text-center">
                    {address}
                  </p>
                </div>
              )}
            </div>

            {/* Identity Verification */}
            <div className="space-y-4">
              <Button
                onClick={handleVerifyIdentity}
                disabled={!address || selfAuthDone}
                variant="secondary"
                className={`w-full py-6 text-lg font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg ${
                  selfAuthDone
                    ? "bg-gradient-to-r from-emerald-600/20 to-emerald-700/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/10"
                    : "backdrop-blur-sm bg-secondary/60 hover:bg-secondary/80 border border-primary/20 shadow-secondary/25"
                }`}
              >
                {selfAuthDone ? (
                  <>
                    <CheckCircle className="mr-3 w-6 h-6" />
                    Identity Verified
                    <Shield className="ml-3 w-6 h-6" />
                  </>
                ) : (
                  <>
                    <QrCode className="mr-3 w-6 h-6" />
                    Verify Identity
                    <Shield className="ml-3 w-6 h-6" />
                  </>
                )}
              </Button>

              {/* QR Code Modal */}
              {showQR && !selfAuthDone && (
                <div className="backdrop-blur-sm bg-background/60 border border-primary/30 p-6 rounded-xl text-center space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Scan QR Code</h3>
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-xl shadow-lg">
                      <SelfQR />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use your mobile device to scan and complete verification
                  </p>
                  <Button
                    onClick={handleSelfAuth}
                    size="sm"
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                  >
                    Complete Verification
                  </Button>
                </div>
              )}
            </div>

            {/* Registration Button */}
            <Button
              onClick={handleSignup}
              disabled={!address || !selfAuthDone}
              className="w-full py-6 text-lg font-bold rounded-xl bg-gradient-to-r from-accent via-primary to-emerald-500 hover:from-accent/90 hover:via-primary/90 hover:to-emerald-500/90 transition-all duration-300 transform hover:scale-[1.02] shadow-xl shadow-primary/25 disabled:opacity-50 disabled:transform-none"
            >
              <Zap className="mr-3 w-6 h-6" />
              Complete Registration
              <Sparkles className="ml-3 w-6 h-6" />
            </Button>

            {/* Status Message */}
            {status && (
              <div className="backdrop-blur-sm bg-primary/10 border border-primary/30 p-4 rounded-xl text-center">
                <p className="font-medium text-foreground">{status}</p>
              </div>
            )}

            {/* Login Link */}
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">Already have an account?</p>
              <Button
                variant="outline"
                onClick={() => router.push("/login")}
                className="backdrop-blur-sm bg-transparent border-accent/30 hover:bg-accent/10 hover:border-accent/50 transition-all duration-300"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Security Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
          {[
            { icon: Shield, title: "Secure", desc: "End-to-end encryption", color: "primary" },
            { icon: Database, title: "Decentralized", desc: "Blockchain powered", color: "accent" },
            { icon: Zap, title: "Instant", desc: "Smart contracts", color: "emerald-400" }
          ].map((feature, index) => (
            <div 
              key={index}
              className="backdrop-blur-sm bg-background/30 border border-primary/20 p-6 rounded-xl text-center transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <div className={`w-12 h-12 bg-gradient-to-br from-${feature.color} to-${feature.color}/70 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Enhanced Footer */}
        <div className="mt-12 text-center max-w-md">
          <p className="text-xs text-muted-foreground leading-relaxed">
            By creating an account, you agree to our{" "}
            <span className="text-primary hover:underline cursor-pointer">Terms of Service</span>{" "}
            and{" "}
            <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  )
}