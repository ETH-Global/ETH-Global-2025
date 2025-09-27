"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Download } from "lucide-react";
import { useWallet } from "@/components/wallet-provider";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface DatasetItem {
  id: string;
  title: string;
  description: string;
  category: string;
  price: string;
  rating: number;
  downloads: number;
  provider: string;
  size: string;
  lastUpdated: string;
  tags: string[];
}

const datasets: DatasetItem[] = [
  {
    id: "1",
    title: "Consumer Behavior Analytics 2024",
    description:
      "Comprehensive dataset covering consumer purchasing patterns, demographics, and behavioral insights across 50+ industries.",
    category: "Consumer Data",
    price: "0.125",
    rating: 4.8,
    downloads: 1247,
    provider: "0x742d...a8f3",
    size: "2.4 GB",
    lastUpdated: "2 hours ago",
    tags: ["Retail", "E-commerce", "Demographics"],
  },
  {
    id: "2",
    title: "Financial Market Sentiment Data",
    description:
      "Real-time sentiment analysis from social media, news, and trading platforms for cryptocurrency and stock markets.",
    category: "Financial",
    price: "0.089",
    rating: 4.9,
    downloads: 892,
    provider: "0x1a2b...c4d5",
    size: "1.8 GB",
    lastUpdated: "15 minutes ago",
    tags: ["Crypto", "Stocks", "Sentiment"],
  },
  {
    id: "3",
    title: "IoT Device Performance Metrics",
    description:
      "Performance data from 10,000+ IoT devices including sensors, smart home devices, and industrial equipment.",
    category: "IoT",
    price: "0.156",
    rating: 4.7,
    downloads: 634,
    provider: "0x9f8e...7d6c",
    size: "3.2 GB",
    lastUpdated: "1 hour ago",
    tags: ["IoT", "Performance", "Industrial"],
  },
  {
    id: "4",
    title: "Healthcare Research Dataset",
    description:
      "Anonymized healthcare data for research purposes, including treatment outcomes and patient demographics.",
    category: "Healthcare",
    price: "0.234",
    rating: 4.9,
    downloads: 445,
    provider: "0x3c4d...e5f6",
    size: "4.1 GB",
    lastUpdated: "3 hours ago",
    tags: ["Healthcare", "Research", "Anonymized"],
  },
  {
    id: "5",
    title: "Climate & Weather Patterns",
    description:
      "Historical and real-time climate data from weather stations worldwide, including temperature, humidity, and precipitation.",
    category: "Environmental",
    price: "0.067",
    rating: 4.6,
    downloads: 1156,
    provider: "0x7e8f...9a0b",
    size: "5.7 GB",
    lastUpdated: "30 minutes ago",
    tags: ["Climate", "Weather", "Environmental"],
  },
  {
    id: "6",
    title: "Social Media Engagement Metrics",
    description:
      "Engagement data from major social platforms including likes, shares, comments, and user interaction patterns.",
    category: "Social Media",
    price: "0.098",
    rating: 4.5,
    downloads: 789,
    provider: "0x5d6e...7f8g",
    size: "1.9 GB",
    lastUpdated: "45 minutes ago",
    tags: ["Social", "Engagement", "Analytics"],
  },
];

export function DataMarketplace() {
  const { isConnected, connectWallet } = useWallet();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const router = useRouter(); // ✅ Top-level hook

  const categories = [
    "All",
    "Consumer Data",
    "Financial",
    "IoT",
    "Healthcare",
    "Environmental",
    "Social Media",
  ];

  const filteredDatasets =
    selectedCategory === "All"
      ? datasets
      : datasets.filter((dataset) => dataset.category === selectedCategory);

  const handlePurchase = async (dataset: DatasetItem) => {
    if (!isConnected) {
      await connectWallet();
      return;
    }
    console.log(`Purchasing dataset: ${dataset.title} for ${dataset.price} ETH`);
  };

  const handleClickDataProvider = () => {
    router.push("/tender"); // ✅ Navigate to /tender
  };

  return (
    <section id="marketplace" className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Data Marketplace</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover premium datasets from verified providers. All transactions are secured by smart contracts
            on the Ethereum blockchain.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="mb-2"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Dataset Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDatasets.map((dataset) => (
            <Card
              key={dataset.id}
              className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300 group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {dataset.category}
                  </Badge>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{dataset.rating}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {dataset.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{dataset.description}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {dataset.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Size</div>
                    <div className="font-medium">{dataset.size}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Downloads</div>
                    <div className="font-medium flex items-center">
                      <Download className="w-3 h-3 mr-1" />
                      {dataset.downloads.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div>
                    <div className="text-2xl font-bold text-primary">{dataset.price} ETH</div>
                    <div className="text-xs text-muted-foreground">Provider: {dataset.provider}</div>
                  </div>
                  <Button onClick={() => handlePurchase(dataset)} className="bg-primary hover:bg-primary/90">
                    {isConnected ? "Purchase" : "Connect Wallet"}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">Last updated: {dataset.lastUpdated}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <Card className="p-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">Ready to Sell Your Data?</h3>
              <p className="text-muted-foreground mb-6">
                Join thousands of data providers earning passive income by sharing valuable datasets with enterprises
                worldwide.
              </p>
              <Button
                onClick={handleClickDataProvider} // ✅ Navigate properly
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                Become a Data Provider
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
