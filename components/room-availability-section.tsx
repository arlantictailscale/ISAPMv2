import { getRoomAvailability } from "@/app/actions/get-room-availability"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Hotel, Users } from "lucide-react"

export async function RoomAvailabilitySection() {
  const roomAvailability = await getRoomAvailability()

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Room Availability for Conference</h2>
            <p className="text-lg text-muted-foreground">
              Special conference rates available. Book your room today to secure your accommodation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Deluxe Room */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Hotel className="w-5 h-5 text-primary" />
                  <CardTitle>Deluxe Room</CardTitle>
                </div>
                <CardDescription>Comfortable room with mountain views</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Available Rooms</span>
                  <span className="text-2xl font-bold text-primary">{roomAvailability.deluxe}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>2 guests per room</span>
                </div>
                <Button asChild className="w-full">
                  <Link href="/pricing">Book Deluxe Room</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Premier Room */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Hotel className="w-5 h-5 text-primary" />
                  <CardTitle>Premier Room</CardTitle>
                </div>
                <CardDescription>Premium room with enhanced amenities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Available Rooms</span>
                  <span className="text-2xl font-bold text-primary">{roomAvailability.premier}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>2 guests per room</span>
                </div>
                <Button asChild className="w-full">
                  <Link href="/pricing">Book Premier Room</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
