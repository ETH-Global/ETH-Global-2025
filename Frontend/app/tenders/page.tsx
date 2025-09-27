"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useWallet } from "@/components/wallet-provider"
import { Clock, User, DollarSign, CheckCircle, XCircle } from "lucide-react"
import { Header } from "@/components/header"
import {useRouter} from "next/navigation"

interface Tender {
  id: string
  title: string
  description: string
  provider: string
  providerName: string
  amount: string
  currency: string
  deadline: string
  category: string
  requirements: string[]
  status: "active" | "expired" | "accepted" | "rejected"
  createdAt: string
}

export default function TendersPage() {
  const { isConnected, connectWallet } = useWallet()
  const [tenders, setTenders] = useState<Tender[]>([])
  const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

  useEffect(() => {
      fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/tenders")
      if (!response.ok) {
        throw new Error("Failed to fetch tenders")
      }
      const data = await response.json()
      setTenders(data.tenders || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tenders")
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (tenderId: string) => {
    if (!isConnected) {
      await connectWallet()
      return
    }

    try {
      const response = await fetch("/api/tenders/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenderId }),
      })

      if (response.ok) {
        setTenders((prev) =>
          prev.map((tender) => (tender.id === tenderId ? { ...tender, status: "accepted" as const } : tender)),
        )
      }
    } catch (err) {
      console.error("Failed to accept tender:", err)
    }
  }

  const handleReject = async (tenderId: string) => {
    if (!isConnected) {
      await connectWallet()
      return
    }

    try {
      const response = await fetch("/api/tenders/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenderId }),
      })

      if (response.ok) {
        setTenders((prev) =>
          prev.map((tender) => (tender.id === tenderId ? { ...tender, status: "rejected" as const } : tender)),
        )
      }
    } catch (err) {
      console.error("Failed to reject tender:", err)
    }
  }

  const getCardStyling = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
      case "rejected":
        return "bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
      default:
        return "bg-card/50 border-border/50 hover:bg-card/80"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return { variant: "default" as const, className: "bg-green-500/20 text-green-400 border-green-500/30" }
      case "rejected":
        return { variant: "default" as const, className: "bg-red-500/20 text-red-400 border-red-500/30" }
      case "active":
        return { variant: "default" as const, className: "bg-blue-500/20 text-blue-400 border-blue-500/30" }
      default:
        return { variant: "secondary" as const, className: "bg-gray-500/20 text-gray-400" }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Available Tenders</h1>
            <p className="text-xl text-muted-foreground">Loading tenders...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-10 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Available Tenders</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover and respond to business tenders from verified providers. All transactions are secured by smart
            contracts.
          </p>
        </div>

        {error && (
          <div className="text-center mb-8">
            <Card className="p-6 bg-destructive/10 border-destructive/20">
              <p className="text-destructive">{error}</p>
              <Button onClick={fetchTenders} className="mt-4">
                Try Again
              </Button>
            </Card>
          </div>
        )}

        {!loading && !error && tenders.length === 0 && (
          <div className="text-center">
            <Card className="p-12 bg-card/50 backdrop-blur-sm border-border/50">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Tenders Available</h3>
                <p className="text-muted-foreground mb-6">
                  There are currently no active tenders. Check back later for new opportunities.
                </p>
                <Button onClick={fetchTenders}>Refresh</Button>
              </div>
            </Card>
          </div>
        )}

        {tenders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tenders.map((tender) => {
              const statusBadge = getStatusBadge(tender.status)
              return (
                <Card
                  key={tender.id}
                  className={`p-6 backdrop-blur-sm transition-all duration-300 group float-animation ${getCardStyling(tender.status)}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <Badge variant={statusBadge.variant} className={statusBadge.className}>
                        {tender.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {tender.category}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                        {tender.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">{tender.description}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <User className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="ml-1 font-medium">{tender.providerName}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="ml-1 font-bold text-primary">
                          {tender.amount} {tender.currency}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">Deadline:</span>
                        <span className="ml-1">{tender.deadline}</span>
                      </div>
                    </div>

                    {tender.requirements.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Requirements:</p>
                        <div className="flex flex-wrap gap-1">
                          {tender.requirements.map((req, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2 pt-4 border-t border-border/50">
                      <Button
                        onClick={() => handleAccept(tender.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        disabled={tender.status !== "active"}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {isConnected ? "Accept" : "Connect to Accept"}
                      </Button>
                      <Button
                        onClick={() => handleReject(tender.id)}
                        variant="outline"
                        className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
                        disabled={tender.status !== "active"}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">Posted: {tender.createdAt}</div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
