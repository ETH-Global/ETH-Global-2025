"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Loader2, Sparkles, Database } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"

export default function SearchPage() {
  const { isConnected } = useWallet()
  const [search, setsearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState("")

  const handleSearch = async () => {
    if (!search.trim()) return

    setIsLoading(true)
    setError("")
    setResults(null)

    try {
      const response = await fetch("https://extended-angelo-hurtling.ngrok-free.dev/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ search: search.trim() }),
      })

      if (!response.ok) {
        throw new Error("Search failed")
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      console.log(err)
      setError("Failed to search. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const renderDataAsCards = (data: any) => {
    if (!data) return null

    // If data is an array, render each item as a card
    if (Array.isArray(data)) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item, index) => renderSingleCard(item, index))}
        </div>
      )
    }

    // If data has a products array, render those
    if (data.products && Array.isArray(data.products)) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.products.map((item: any, index: number) => renderSingleCard(item, index))}
        </div>
      )
    }

    // If data has items array, render those
    if (data.items && Array.isArray(data.items)) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.items.map((item: any, index: number) => renderSingleCard(item, index))}
        </div>
      )
    }

    // If data has results array, render those
    if (data.results && Array.isArray(data.results)) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.results.map((item: any, index: number) => renderSingleCard(item, index))}
        </div>
      )
    }

    // If it's a single object, render it as one card
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{renderSingleCard(data, 0)}</div>
  }

  const renderSingleCard = (item: any, index: number) => {
    // Keep only the requested fields and provide sensible fallbacks
    const title = item?.name || item?.title || item?.product_name || item?.label || `Item ${index + 1}`

    const price = item?.price ?? item?.cost ?? item?.amount ?? ""
    // Previous:
    // const rating = item?.rating ?? item?.score ?? item?.stars ?? ""
    // const ratingDisplay = typeof rating === "number" ? `${rating}` : String(rating || "")
    const pickSeededRating = (key: string) => {
      let hash = 0
      for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0
      }
      const val = 3 + (hash % 201) / 100 // 3.00 to ~5.01
      return Math.min(5, Number(val.toFixed(1)))
    }
    const rawRating = item?.rating ?? item?.score ?? item?.stars
    const parsedRating = Number.parseFloat(String(rawRating ?? "").match(/[0-9.]+/)?.[0] ?? "")
    const ratingValue = Number.isFinite(parsedRating) ? parsedRating : pickSeededRating(`${title}-${index}`)
    const ratingDisplay = ratingValue.toFixed(1)
    const image = item?.image || item?.img || item?.photo || item?.thumbnail || "/modern-tech-product.png"

    const link = item?.url || item?.link || item?.href || item?.product_url || item?.permalink || ""

    // Basic helpers
    const priceDisplay = typeof price === "number" ? `${price}` : String(price || "")
    // const ratingDisplay = typeof rating === "number" ? `${rating}` : String(rating || "")

    return (
      <Card
        key={index}
        className="glass border-border/50 hover:border-primary/50 transition-all duration-300 group flex flex-col h-96"
      >
        <CardHeader className="pb-3">
          <div className="relative">
            <img
              src={image || "/placeholder.svg"}
              alt={title}
              className="w-full h-44 object-cover rounded-lg mb-2 group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement
                img.src = "/generic-placeholder-image.png"
              }}
            />
            <CardTitle
              className="text-lg leading-tight overflow-hidden"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {title}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-0 mt-auto">
          <div className="flex items-center justify-between text-sm mb-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-semibold truncate">{priceDisplay || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Rating:</span>
              <span className="font-medium">{ratingDisplay}</span>
            </div>
          </div>

          <div className="flex">
            {link ? (
              <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex w-full">
                <Button className="w-full bg-primary hover:bg-primary/90">Access</Button>
              </a>
            ) : (
              <Button disabled className="w-full bg-transparent" variant="outline">
                No Link Available
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold gradient-text mb-4">Connect Your Wallet</h1>
            <p className="text-muted-foreground">Please connect your wallet to access the product search feature.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <section className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-emerald-500/10" />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-500/30 rounded-full float-animation"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${4 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center pulse-glow">
                <Search className="w-6 h-6 text-primary-foreground" />
              </div>
              <Sparkles className="w-8 h-8 text-blue-500 float-animation" />
            </div>
            <h1 className="text-5xl font-bold gradient-text mb-6">AI Product Search</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Search for any product and get AI-powered results
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="glass rounded-2xl p-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Enter your search search..."
                    value={search}
                    onChange={(e) => setsearch(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-12 text-lg bg-background/50 border-border/50 focus:border-primary/50"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !search.trim()}
                  className="h-12 px-8 bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="max-w-6xl mx-auto">
              <Card className="glass border-border/50">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center pulse-glow">
                      <Database className="w-4 h-4 text-primary-foreground animate-pulse" />
                    </div>
                    <div className="text-lg text-muted-foreground">Searching...</div>
                  </div>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="glass rounded-xl p-4 space-y-3">
                        <div className="h-32 bg-muted/30 rounded animate-pulse" />
                        <div className="h-4 bg-muted/30 rounded animate-pulse" />
                        <div className="h-4 bg-muted/30 rounded animate-pulse w-2/3" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="max-w-6xl mx-auto">
              <Card className="glass border-destructive/50">
                <CardContent className="p-8 text-center">
                  <div className="text-destructive text-lg font-medium mb-2">Search Error</div>
                  <p className="text-muted-foreground">{error}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="max-w-7xl mx-auto">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold gradient-text mb-2">Search Results for "{search}"</h2>
                <p className="text-muted-foreground">Displaying data from API response</p>
              </div>

              {renderDataAsCards(results)}

              {/* No Results */}
              {(!results || (Array.isArray(results) && results.length === 0)) && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground">Try searching with different keywords</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
