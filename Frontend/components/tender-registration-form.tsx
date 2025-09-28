"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Building2, Clock, DollarSign, FileText, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { registerNewTenderRPC } from "@/ethers/newTender"; //

export interface Tender {
  id: string
  name: string
  time: string
  rate: string
  description: string
  keyFeatures: string[]
  createdAt: string
}

export function TenderRegistrationForm() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    time: "",
    rate: "",
    description: "",
    keyFeatures: [] as string[],
  })
  const [newFeature, setNewFeature] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addKeyFeature = () => {
    if (newFeature.trim() && !formData.keyFeatures.includes(newFeature.trim())) {
      setFormData((prev) => ({
        ...prev,
        keyFeatures: [...prev.keyFeatures, newFeature.trim()],
      }))
      setNewFeature("")
    }
  }

  const removeKeyFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      keyFeatures: prev.keyFeatures.filter((f) => f !== feature),
    }))
  }

  //goyal's code
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   setIsSubmitting(true)

  //   try {
  //     const newTender: Tender = {
  //       id: Date.now().toString(),
  //       ...formData,
  //       createdAt: new Date().toISOString(),
  //     }

  //     const existingTenders = JSON.parse(localStorage.getItem("tenders") || "[]")
  //     const updatedTenders = [...existingTenders, newTender]
  //     localStorage.setItem("tenders", JSON.stringify(updatedTenders))

  //     setFormData({
  //       name: "",
  //       time: "",
  //       rate: "",
  //       description: "",
  //       keyFeatures: [],
  //     })

  //     toast({
  //       title: "Tender Registered Successfully",
  //       description: "Your tender has been added to the system.",
  //     })
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: "Failed to register tender. Please try again.",
  //       variant: "destructive",
  //     })
  //   } finally {
  //     setIsSubmitting(false)
  //   }
  // }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parse inputs
      const durationMinutes = parseInt(formData.time); // minutes input
      if (isNaN(durationMinutes) || durationMinutes <= 0) {
        throw new Error("Duration must be a positive number of minutes");
      }

      const stakeEth = formData.rate; // ETH stake, e.g., "0.05"

      // Optional: Add inputs for min/max participants
      const minParticipants = 2; // can be made dynamic
      const maxParticipants = 10; // can be made dynamic

      // Call the blockchain RPC function to deploy tender
      const tenderAddress = await registerNewTenderRPC(
        durationMinutes,
        minParticipants,
        maxParticipants,
        stakeEth
      );

      console.log("Tender deployed at:", tenderAddress);

      // Save tender locally (optional)
      const newTender: Tender = {
        id: tenderAddress, // use contract address as unique ID
        ...formData,
        createdAt: new Date().toISOString(),
      };
      const existingTenders = JSON.parse(localStorage.getItem("tenders") || "[]");
      localStorage.setItem("tenders", JSON.stringify([...existingTenders, newTender]));

      // Reset form
      setFormData({
        name: "",
        time: "",
        rate: "",
        description: "",
        keyFeatures: [],
      });

      toast({
        title: "Tender Registered Successfully",
        description: `Tender deployed on-chain at ${tenderAddress}`,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to deploy tender",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <Card className="border-border bg-card backdrop-blur-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center space-x-2 text-primary">
            <Building2 className="h-6 w-6 text-primary" />
            <span>Register New Tender</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Fill out the form below to register a new tender opportunity
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
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="bg-background border-border focus:border-primary focus:ring-primary/30"
              />
            </div>

            {/* Time and Rate */}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                  required
                  className="bg-background border-border focus:border-primary focus:ring-primary/30"
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
                  placeholder="e.g., $50,000 - $100,000"
                  value={formData.rate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rate: e.target.value }))}
                  required
                  className="bg-background border-border focus:border-primary focus:ring-primary/30"
                />
              </div>
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
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                required
                rows={4}
                className="bg-background border-border focus:border-primary focus:ring-primary/30 resize-none"
              />
            </div>

            {/* Key Features */}
            <div className="space-y-3">
              <Label className="flex items-center space-x-2 text-sm font-medium">
                <Star className="h-4 w-4 text-primary" />
                <span>Key Features</span>
              </Label>

              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Add a key feature"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyFeature())}
                  className="bg-background border-border focus:border-primary focus:ring-primary/30"
                />
                <Button
                  type="button"
                  onClick={addKeyFeature}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:opacity-90 pulse-glow"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.keyFeatures.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.keyFeatures.map((feature, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-secondary text-secondary-foreground flex items-center space-x-1"
                    >
                      <span>{feature}</span>
                      <button
                        type="button"
                        onClick={() => removeKeyFeature(feature)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground hover:opacity-90 font-medium py-2.5"
            >
              {isSubmitting ? "Registering..." : "Register Tender"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
