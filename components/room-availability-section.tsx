import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Hotel } from "lucide-react"
import { getRoomAvailability } from "@/app/actions/get-room-availability"

export async function RoomAvailabilitySection({ DeluxeRoomGallery, PremierRoomGallery }: any) {
  const roomAvailability = await getRoomAvailability()

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-cyan-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Hotel className="w-8 h-8 text-cyan-600" />
          <h2 className="font-display text-3xl font-bold">Hotel Accommodations & Booking</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Room Types & Pricing */}
          <div className="space-y-6">
            <Card className="border-cyan-200 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-600" />
                  Deluxe Room
                </CardTitle>
                <CardDescription>Spacious comfort with modern amenities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <span className="text-sm font-medium text-cyan-900">Rooms Available:</span>
                    <span className="text-lg font-bold text-cyan-600">
                      {roomAvailability.deluxe.available} / {roomAvailability.deluxe.total}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-cyan-600">Rp 1,250,000</span>
                    <span className="text-muted-foreground">/ night</span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-cyan-600 font-bold">•</span> King or twin beds
                    </li>
                    <li className="flex gap-2">
                      <span className="text-cyan-600 font-bold">•</span> Mountain or garden view
                    </li>
                    <li className="flex gap-2">
                      <span className="text-cyan-600 font-bold">•</span> Modern bathroom with amenities
                    </li>
                    <li className="flex gap-2">
                      <span className="text-cyan-600 font-bold">•</span> Complimentary WiFi & breakfast
                    </li>
                  </ul>
                  <DeluxeRoomGallery />
                </div>
              </CardContent>
            </Card>

            <Card className="border-cyan-200 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-600" />
                  Premier Room
                </CardTitle>
                <CardDescription>Enhanced luxury and exclusive amenities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <span className="text-sm font-medium text-cyan-900">Rooms Available:</span>
                    <span className="text-lg font-bold text-cyan-600">
                      {roomAvailability.premier.available} / {roomAvailability.premier.total}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-cyan-600">Rp 1,350,000</span>
                    <span className="text-muted-foreground">/ night</span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-cyan-600 font-bold">•</span> Spacious rooms with sitting area
                    </li>
                    <li className="flex gap-2">
                      <span className="text-cyan-600 font-bold">•</span> Private balcony with resort views
                    </li>
                    <li className="flex gap-2">
                      <span className="text-cyan-600 font-bold">•</span> Luxury bathroom with rainfall shower
                    </li>
                    <li className="flex gap-2">
                      <span className="text-cyan-600 font-bold">•</span> Premium toiletries & concierge service
                    </li>
                  </ul>
                  <PremierRoomGallery />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Room Features & Amenities */}
          <div className="space-y-6">
            <Card className="border-cyan-200 shadow-md">
              <CardHeader>
                <CardTitle>Room Features & Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <p className="text-sm font-semibold text-cyan-900">High-Speed WiFi</p>
                    <p className="text-xs text-cyan-700 mt-1">Complimentary throughout the resort</p>
                  </div>
                  <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <p className="text-sm font-semibold text-cyan-900">Daily Breakfast</p>
                    <p className="text-xs text-cyan-700 mt-1">Buffet with international cuisine</p>
                  </div>
                  <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <p className="text-sm font-semibold text-cyan-900">24/7 Room Service</p>
                    <p className="text-xs text-cyan-700 mt-1">Full menu available anytime</p>
                  </div>
                  <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <p className="text-sm font-semibold text-cyan-900">Air Conditioning</p>
                    <p className="text-xs text-cyan-700 mt-1">Climate-controlled comfort</p>
                  </div>
                  <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <p className="text-sm font-semibold text-cyan-900">Work Desk</p>
                    <p className="text-xs text-cyan-700 mt-1">Ergonomic desk with chair</p>
                  </div>
                  <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <p className="text-sm font-semibold text-cyan-900">Flat-Screen TV</p>
                    <p className="text-xs text-cyan-700 mt-1">International channels available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
