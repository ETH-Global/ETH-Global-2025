"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Shield, CheckCircle, Wallet, Zap, ArrowLeft } from "lucide-react"
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
  const [address, setAddress] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [selfAuthDone, setSelfAuthDone] = useState<boolean>(false)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [mounted, setMounted] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Only show QR when wallet is connected and verification isn't done yet
  useEffect(() => {
    if (address && !selfAuthDone) {
      setStatus("Please complete identity verification...")
      // Small delay to ensure smooth UX transition
      setTimeout(() => {
        setQrOpen(true)
      }, 500)
    }
  }, [address, selfAuthDone])

  const connectWallet = async (): Promise<void> => {
    if (typeof window.ethereum === "undefined") {
      setStatus("MetaMask not detected. Please install MetaMask to continue.")
      return
    }

    setIsConnecting(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any)
      const accounts: string[] = await provider.send("eth_requestAccounts", [])
      
      if (accounts.length > 0) {
        setAddress(accounts[0])
        setStatus("Wallet connected successfully! ✨ Preparing identity verification...")
      }
    } catch (err) {
      console.error("Wallet connection error:", err)
      setStatus("Failed to connect wallet. Please try again.")
      // Reset states on error
      setAddress("")
      setQrOpen(false)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = (): void => {
    setAddress("")
    setSelfAuthDone(false)
    setQrOpen(false)
    setStatus("Wallet disconnected. Connect again to continue.")
  }

  type Attestation = {
    userId?: string
    token?: string
    raw?: unknown
  }

  // This function is called ONLY on successful verification
  const handleSuccessfulVerification = (attestation: Attestation) => {
    console.log("✅ Verification Successful!", attestation)
    console.log("Attestation - ", attestation)

    setSelfAuthDone(true)
    setQrOpen(false)
    setStatus("Identity verification completed! 🔐 Redirecting to login...")
    
    setTimeout(() => {
      router.push("/login")
    }, 2000)
  }

  // This function is called ONLY on failed verification
  const handleFailedVerification = (reason?: string) => {
    console.log("❌ Verification Failed!")
    setSelfAuthDone(false)
    setQrOpen(false)
    setStatus(`Verification failed${reason ? `: ${reason}` : ""}. Please try again.`)
  }

  const handleQrVerified = (payload: { userId?: string; token?: string }) => {
    const attestation: Attestation = { userId: payload.userId, token: payload.token, raw: payload }
    handleSuccessfulVerification(attestation)
  }

  const handleQrError = (message: string) => {
    handleFailedVerification(message)
  }

  const handleQrClose = () => {
    setQrOpen(false)
    if (!selfAuthDone) {
      setStatus("Identity verification cancelled. Please complete verification to continue.")
    }
  }

  const retryVerification = () => {
    if (address && !selfAuthDone) {
      setStatus("Starting identity verification...")
      setQrOpen(true)
    }
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
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* 3D Background Scene - Only render on client */}
      {mounted && (
        <div className="fixed inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
            <SignupScene />
          </Canvas>
        </div>
      )}

      {/* Particle Field - Only render on client */}
      {mounted && <ParticleField />}

      {/* QR Component - ONLY shown when wallet is connected AND verification not done */}

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
                onClick={address ? disconnectWallet : connectWallet}
                disabled={isConnecting}
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
                  <Button
                    onClick={disconnectWallet}
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs text-muted-foreground hover:text-red-400"
                    >
                    Disconnect Wallet
                  </Button>
                </div>
              )}
            </div>

              {address && !selfAuthDone && (
                <SelfQR
                  address={address}
                />
              )}
            <div className="glass p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className={selfAuthDone ? "w-5 h-5 text-emerald-400" : "w-5 h-5 text-muted-foreground"} />
                <span className="text-sm">Identity</span>
              </div>
              {selfAuthDone ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400">Verified</span>
                </div>
              ) : address ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {qrOpen ? "Verifying..." : "Ready to verify"}
                  </span>
                  {!qrOpen && (
                    <Button
                      onClick={retryVerification}
                      size="sm"
                      variant="ghost"
                      className="text-xs text-primary hover:text-primary/80"
                    >
                      Start
                    </Button>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Connect wallet first</span>
              )}
            </div>

            <Button
              onClick={handleSignup}
              disabled={!address || !selfAuthDone}
              className="w-full py-4 text-base font-semibold bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 transition-all duration-300 pulse-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="mr-3 w-5 h-5" />
              Complete Registration
            </Button>

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