"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { updateRoomAvailability } from "@/app/actions/update-room-availability"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface RoomAvailabilityFormProps {
  deluxeCapacity: number
  premierCapacity: number
}

export function RoomAvailabilityForm({ deluxeCapacity, premierCapacity }: RoomAvailabilityFormProps) {
  const [deluxe, setDeluxe] = useState(deluxeCapacity)
  const [premier, setPremier] = useState(premierCapacity)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await updateRoomAvailability({ deluxe, premier })

      if (result.success) {
        toast({
          title: "Success",
          description: "Room availability settings updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update room availability",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="deluxe">Deluxe Room Capacity</Label>
          <Input
            id="deluxe"
            type="number"
            min="0"
            value={deluxe}
            onChange={(e) => setDeluxe(Number(e.target.value))}
            required
          />
          <p className="text-sm text-muted-foreground">Total number of deluxe rooms available</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="premier">Premier Room Capacity</Label>
          <Input
            id="premier"
            type="number"
            min="0"
            value={premier}
            onChange={(e) => setPremier(Number(e.target.value))}
            required
          />
          <p className="text-sm text-muted-foreground">Total number of premier rooms available</p>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full bg-cyan-600 hover:bg-cyan-700">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Room Availability"
        )}
      </Button>
    </form>
  )
}
