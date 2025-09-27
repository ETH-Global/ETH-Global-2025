import { type NextRequest, NextResponse } from "next/server"

interface SearchRequest {
  query: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json()

    if (!body.query || typeof body.query !== "string") {
      return NextResponse.json({ error: "Query is required and must be a string" }, { status: 400 })
    }

    // Replace 'YOUR_API_ENDPOINT' with the actual API endpoint URL
    const apiEndpoint = process.env.EXTERNAL_API_ENDPOINT || "https://api.example.com/search"

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add any required API keys or headers here
        ...(process.env.API_KEY && { Authorization: `Bearer ${process.env.API_KEY}` }),
      },
      body: JSON.stringify({ query: body.query }),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()

    // Return the data as-is from the external API
    return NextResponse.json(data)
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Failed to fetch data from external API" }, { status: 500 })
  }
}
