"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Shield, CheckCircle, Wallet, Zap, ArrowLeft } from "lucide-react"
import SelfQR from "@/components/self-qr";
import { useRouter } from "next/navigation"

const Canvas = dynamic(() => import("@react-three/fiber").then((mod) => mod.Canvas), {
  ssr: false,
})

const SignupScene = dynamic(() => import("./signup-scene"), {
  ssr: false,
})

function ParticleField() {
  const [particles, setParticles] = useState<
    Array<{ id: number; left: number; top: number; delay: number; duration: number }>
  >([])

  useEffect(() => {
    const particleArray = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
    }))
    setParticles(particleArray)
  }, [])

  return (
    <div className="fixed inset-0 z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-primary/30 rounded-full animate-pulse"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function SignupForm() {
  const [address, setAddress] = useState<string | null>(null)
  const [status, setStatus] = useState<string>("")
  const [selfAuthDone, setSelfAuthDone] = useState<boolean>(false)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [mounted, setMounted] = useState(false)
  const [showQR, setShowQR] = useState(false);
  const router = useRouter()
  window.ethereum.autoRefreshOnNetworkChange = false

  useEffect(() => {
    setMounted(true)


  if (typeof window.ethereum !== "undefined") {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0])
        setStatus("🔄 Wallet account changed.")
      } else {
        setAddress("")
        setStatus("⚠️ MetaMask is locked or no accounts are connected.")
      }
    }

      window.ethereum.on("accountsChanged", handleAccountsChanged)

      // Cleanup on unmount
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [])


  const connectWallet = async (): Promise<void> => {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask not detected")
      return
    }

    setIsConnecting(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])
      setAddress(accounts[0] || null)
      setStatus("Wallet connected successfully! ✨")
    } catch (err) {
      console.error(err)
      setStatus("Failed to connect wallet. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSelfAuth = (): void => {
    setSelfAuthDone(true)
    setShowQR((prev) => !prev);
    setStatus("Identity verification completed! 🔐")
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {mounted && (
        <div className="fixed inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
            <SignupScene />
          </Canvas>
        </div>
      )}

      {mounted && <ParticleField />}


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
          <p className="text-muted-foreground text-lg">Join the future of data monetization</p>
        </div>

        {/* Main Card */}
        <Card className="glass w-full max-w-md float-animation">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold mb-2">Create Account</CardTitle>
            <p className="text-muted-foreground text-sm">
              Connect your wallet and start selling your valuable data on the blockchain
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Button
                onClick={connectWallet}
                disabled={isConnecting || !!address}
                className={`w-full py-4 text-base font-medium transition-all duration-300 ${
                  address
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-primary hover:bg-primary/90 pulse-glow"
                  }`}
              >
                <Wallet className="mr-3 w-5 h-5" />
                {isConnecting ? "Connecting..." : address ? "Wallet Connected" : "Connect MetaMask"}
                {address && <CheckCircle className="ml-3 w-5 h-5" />}
              </Button>

              {address && (
                <div className="glass p-3 rounded-lg border border-emerald-500/30">
                  <p className="text-xs text-emerald-400 font-mono break-all">{address}</p>
                </div>
              )}
            </div>

    <div className="space-y-3">
        <SelfQR
    address={address ?? "0x0000000000000000000000000000000000000000"}
  />
        
    </div>

            {status && (
              <div className="glass p-4 rounded-lg text-center">
                <p className="text-sm font-medium text-foreground">{status}</p>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Already have an account?</p>
              <Button
                variant="outline"
                onClick={() => router.push("/login")}
                className="glass border-accent/30 hover:bg-accent/10 bg-transparent"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
          <div className="glass p-4 rounded-lg text-center">
            <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Secure</h3>
            <p className="text-xs text-muted-foreground">End-to-end encryption</p>
          </div>
          <div className="glass p-4 rounded-lg text-center">
            <Database className="w-8 h-8 text-accent mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Decentralized</h3>
            <p className="text-xs text-muted-foreground">Blockchain powered</p>
          </div>
          <div className="glass p-4 rounded-lg text-center">
            <Zap className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Instant</h3>
            <p className="text-xs text-muted-foreground">Smart contracts</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>By creating an account, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  )
}
