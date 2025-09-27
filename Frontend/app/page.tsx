"use client"

import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { BlockchainStats } from "@/components/blockchain-stats"
import { DataMarketplace } from "@/components/data-marketplace"
// import { PricingSection } from "@/components/pricing-section"
// import { Footer } from "@/components/footer"
import { useWallet } from "@/components/wallet-provider"
import SignupForm from "@/components/signup-form"

export default function HomePage() {
  const { isConnected } = useWallet()

  if (!isConnected) {
    return <SignupForm />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <HeroSection />
      <BlockchainStats />
      {/* <DataMarketplace /> */}
    </div>
  )
}
