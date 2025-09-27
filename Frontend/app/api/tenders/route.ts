import { NextResponse } from "next/server"

// Mock tender data - in a real app, this would come from a database
const mockTenders = [
  {
    id: "1",
    title: "Supply Chain Data Analytics Platform",
    description:
      "We need a comprehensive data analytics platform to track and analyze our global supply chain operations. The platform should provide real-time insights, predictive analytics, and automated reporting capabilities.",
    provider: "0x742d35Cc6634C0532925a3b8D0C9964E8d8a8f3",
    providerName: "Global Logistics Corp",
    amount: "50.5",
    currency: "ETH",
    deadline: "2024-02-15",
    category: "Analytics",
    requirements: ["Real-time tracking", "API integration", "Custom dashboards", "Mobile app"],
    status: "active" as const,
    createdAt: "2024-01-10",
  },
  {
    id: "2",
    title: "Customer Behavior Analysis Tool",
    description:
      "Looking for a sophisticated tool to analyze customer behavior patterns across multiple touchpoints. The solution should include machine learning capabilities for predictive modeling.",
    provider: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
    providerName: "RetailTech Solutions",
    amount: "35.2",
    currency: "ETH",
    deadline: "2024-02-20",
    category: "Machine Learning",
    requirements: ["ML algorithms", "Data visualization", "API endpoints", "Cloud deployment"],
    status: "accepted" as const,
    createdAt: "2024-01-12",
  },
  {
    id: "3",
    title: "Blockchain Transaction Monitor",
    description:
      "Develop a monitoring system for tracking blockchain transactions across multiple networks. The system should provide alerts, analytics, and compliance reporting features.",
    provider: "0x9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c",
    providerName: "CryptoWatch Inc",
    amount: "75.8",
    currency: "ETH",
    deadline: "2024-01-25",
    category: "Blockchain",
    requirements: ["Multi-chain support", "Real-time alerts", "Compliance tools", "API access"],
    status: "rejected" as const,
    createdAt: "2024-01-05",
  },
  {
    id: "4",
    title: "IoT Device Management System",
    description:
      "Create a comprehensive management system for IoT devices including device registration, monitoring, firmware updates, and data collection capabilities.",
    provider: "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v",
    providerName: "SmartDevice Networks",
    amount: "42.3",
    currency: "ETH",
    deadline: "2024-03-01",
    category: "IoT",
    requirements: ["Device management", "OTA updates", "Data analytics", "Security features"],
    status: "active" as const,
    createdAt: "2024-01-15",
  },
  {
    id: "5",
    title: "Financial Risk Assessment Platform",
    description:
      "Build a platform for assessing financial risks using advanced algorithms and market data. The platform should provide risk scores, recommendations, and portfolio optimization features.",
    provider: "0x7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x",
    providerName: "FinRisk Analytics",
    amount: "68.7",
    currency: "ETH",
    deadline: "2024-02-28",
    category: "Finance",
    requirements: ["Risk modeling", "Market data integration", "Portfolio tools", "Reporting"],
    status: "active" as const,
    createdAt: "2024-01-08",
  },
]

const tenderStatuses: Record<string, "active" | "expired" | "accepted" | "rejected"> = {}

export async function GET() {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const updatedTenders = mockTenders.map((tender) => ({
      ...tender,
      status: tenderStatuses[tender.id] || tender.status,
    }))

    return NextResponse.json({
      success: true,
      tenders: updatedTenders,
      total: updatedTenders.length,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch tenders" }, { status: 500 })
  }
}

export function updateTenderStatus(tenderId: string, status: "accepted" | "rejected") {
  tenderStatuses[tenderId] = status
}
