"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { TrendingUp, Users, Database, DollarSign, Activity, Shield } from "lucide-react"
import { useEffect, useState } from "react"

interface StatItem {
  icon: React.ReactNode
  label: string
  value: string
  change: string
  trend: "up" | "down"
}

export function BlockchainStats() {
  const [stats, setStats] = useState<StatItem[]>([
    {
      icon: <DollarSign className="w-5 h-5" />,
      label: "Total Volume (24h)",
      value: "$847,293",
      change: "+12.5%",
      trend: "up",
    },
    {
      icon: <Database className="w-5 h-5" />,
      label: "Active Datasets",
      value: "3,247",
      change: "+8.2%",
      trend: "up",
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Enterprise Buyers",
      value: "456",
      change: "+15.3%",
      trend: "up",
    },
    {
      icon: <Activity className="w-5 h-5" />,
      label: "Transactions",
      value: "12,847",
      change: "+23.1%",
      trend: "up",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: "Security Score",
      value: "99.8%",
      change: "+0.2%",
      trend: "up",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: "Avg. Data Price",
      value: "0.045 ETH",
      change: "+5.7%",
      trend: "up",
    },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prevStats) =>
        prevStats.map((stat) => ({
          ...stat,
          value: stat.label.includes("Volume")
            ? `$${(Math.random() * 100000 + 800000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
            : stat.value,
        })),
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Live Blockchain Analytics</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real-time insights into our decentralized data marketplace powered by Ethereum smart contracts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">{stat.icon}</div>
                <div
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    stat.trend === "up" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {stat.change}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Data flow animation */}
        <div className="mt-12 relative">
          <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent">
            <div className="absolute top-0 left-0 w-20 h-px bg-primary data-flow"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
