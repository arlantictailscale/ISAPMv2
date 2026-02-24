import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Hotel, Users } from "lucide-react"

export function EventOverviewCard() {
  return (
    <Card className="sticky top-24 h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <CardTitle>Event Overview</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Dates */}
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            Event Dates
          </h3>
          <p className="text-sm font-medium">April 16-19, 2026</p>
          <ul className="text-sm text-muted-foreground space-y-1 mt-2">
            <li>• Day 1-2: CPD Courses (April 16-17)</li>
            <li>• Day 2: Workshop (April 17)</li>
            <li>• Day 3: Symposium (April 18)</li>
            <li>• Day 4: City Tours (April 19)</li>
          </ul>
        </div>

        {/* Location */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-primary" />
            Location
          </h3>
          <p className="text-sm font-medium">The Singhasari Hotel & Convention</p>
          <p className="text-sm text-muted-foreground">Batu, Malang, Jawa Timur, Indonesia</p>
        </div>

        {/* Room Availability */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <Hotel className="w-4 h-4 text-primary" />
            Room Availability
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Deluxe Room</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                118 available
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Premier Room</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                55 available
              </Badge>
            </div>
          </div>
        </div>

        {/* Extra Bed Option */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" />
            Extra Bed Option
          </h3>
          <p className="text-sm font-medium">Rp 550.000/night</p>
          <p className="text-xs text-amber-600 mt-1">✳️ Includes breakfast for extra guest</p>
        </div>
      </CardContent>
    </Card>
  )
}
