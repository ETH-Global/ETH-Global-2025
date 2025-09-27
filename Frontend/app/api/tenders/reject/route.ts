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

    updateTenderStatus(tenderId, "rejected")

    console.log(`Tender ${tenderId} rejected`)

    return NextResponse.json({
      success: true,
      message: "Tender rejected successfully",
      tenderId,
      status: "rejected",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to reject tender" }, { status: 500 })
  }
}
