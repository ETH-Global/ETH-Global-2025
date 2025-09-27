"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building2, Clock, DollarSign, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// ✅ ABI + Contract Address (replace with your deployed values)
import TenderABI from "@/abi/New_final_TenderV2.json"
const CONTRACT_ADDRESS = "0xYourDeployedContractAddress"

export function TenderRegistrationForm() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    time: "",
    rate: "",
    description: "",
    fee: "", // ✅ new field for ETH payment
    keyFeatures: [] as string[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!(window as any).ethereum) {
        throw new Error("MetaMask not detected")
      }

      // ✅ Connect to MetaMask
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, TenderABI, signer)

      if (!formData.fee || Number(formData.fee) <= 0) {
        throw new Error("Please enter a valid ETH fee")
      }

      // 🔑 Call createTender with ETH payment
      const tx = await contract.createTender(
        formData.name,
        formData.time,
        formData.rate,
        formData.description,
        formData.keyFeatures,
        {
          value: ethers.parseEther(formData.fee), // ✅ send ETH to contract
        }
      )

      await tx.wait()

      // Reset form
      setFormData({
        name: "",
        time: "",
        rate: "",
        description: "",
        fee: "",
        keyFeatures: [],
      })

      toast({
        title: "Tender Registered Successfully",
        description: `Transaction Hash: ${tx.hash}`,
      })
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error.message || "Transaction failed",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <Card className="border-border bg-card backdrop-blur-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center space-x-2 text-primary">
            <Building2 className="h-6 w-6 text-primary" />
            <span>Register New Tender</span>
          </CardTitle>
          <CardDescription>
            Fill out the form below to register a new tender opportunity and pay the fee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tender Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center space-x-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-primary" />
                <span>Tender Name</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter tender name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Duration & Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center space-x-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Tender Duration</span>
                </Label>
                <Input
                  id="time"
                  type="text"
                  placeholder="e.g., 30 days, 3 months"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate" className="flex items-center space-x-2 text-sm font-medium">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span>Tender Rate</span>
                </Label>
                <Input
                  id="rate"
                  type="text"
                  placeholder="e.g., $50,000"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Tender Fee (ETH) */}
            <div className="space-y-2">
              <Label htmlFor="fee" className="flex items-center space-x-2 text-sm font-medium">
                <DollarSign className="h-4 w-4 text-primary" />
                <span>Tender Fee (ETH)</span>
              </Label>
              <Input
                id="fee"
                type="number"
                step="0.01"
                placeholder="e.g., 0.05"
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Tender Description
              </Label>
              <Textarea
                id="description"
                placeholder="Provide a detailed description of the tender requirements..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Submit */}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Registering..." : "Register Tender & Pay"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
