import { type NextRequest, NextResponse } from "next/server"
import { updateTenderStatus } from "../route"

export async function POST(request: NextRequest) {
  try {
    const { tenderId } = await request.json()

    if (!tenderId) {
      return NextResponse.json({ success: false, error: "Tender ID is required" }, { status: 400 })
    }

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 500))

    updateTenderStatus(tenderId, "accepted")

    console.log(`Tender ${tenderId} accepted`)

    return NextResponse.json({
      success: true,
      message: "Tender accepted successfully",
      tenderId,
      status: "accepted",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to accept tender" }, { status: 500 })
  }
}
