"use client"

import { useEffect, useState } from "react"
import { Globe, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getParticipantDistribution, type ParticipantMapData } from "@/app/actions/participant-map"
import { INDONESIA_PROVINCES } from "@/lib/data/indonesia-provinces"

// Color scale for participant counts
const getMarkerColor = (count: number, maxCount: number): string => {
  const intensity = Math.min(count / Math.max(maxCount, 1), 1)
  
  if (intensity < 0.2) return "#5eead4" // teal-300
  if (intensity < 0.4) return "#2dd4bf" // teal-400
  if (intensity < 0.6) return "#14b8a6" // teal-500
  if (intensity < 0.8) return "#0d9488" // teal-600
  return "#0f766e" // teal-700
}

// Calculate marker size based on count
const getMarkerSize = (count: number, maxCount: number): number => {
  const minSize = 8
  const maxSize = 28
  const intensity = Math.min(count / Math.max(maxCount, 1), 1)
  return minSize + (maxSize - minSize) * Math.sqrt(intensity)
}

export function IndonesiaSvgMap() {
  const [mapData, setMapData] = useState<ParticipantMapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getParticipantDistribution()
        setMapData(data)
      } catch (error) {
        console.error("Failed to load participant map data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Create a map of province name to participant count and coordinates
  const provinceMarkers: Array<{
    id: string
    name: string
    count: number
    x: number
    y: number
  }> = []

  const maxCount = mapData?.provinces.reduce((max, p) => Math.max(max, p.count), 0) || 1

  mapData?.provinces.forEach(p => {
    if (!p.name) return
    // Try to find province by name - handle partial matches and variations
    const searchName = p.name.toLowerCase().trim()
    const province = INDONESIA_PROVINCES.find(prov => {
      if (!prov.name) return false
      const provName = prov.name.toLowerCase().trim()
      // Exact match or partial match
      return provName === searchName || 
             provName.includes(searchName) || 
             searchName.includes(provName)
    })
    
    if (province && province.coordinates) {
      // coordinates is [longitude, latitude] array
      const lng = province.coordinates[0]
      const lat = province.coordinates[1]
      provinceMarkers.push({
        id: province.id,
        name: p.name, // Use the original name from data
        count: p.count,
        // Convert lng/lat to SVG coordinates (approximate mapping for Indonesia)
        // SVG viewBox is 0 0 1875 750
        // Indonesia roughly spans: lng 95-141, lat -11 to 6
        x: ((lng - 95) / (141 - 95)) * 1875,
        y: ((6 - lat) / (6 - (-11))) * 750,
      })
    }
  })

  // Get province info for tooltip
  const getProvinceInfo = (provinceId: string) => {
    const marker = provinceMarkers.find(m => m.id === provinceId)
    return marker || null
  }

  const stats = {
    totalParticipants: mapData?.totalParticipants || 0,
    totalProvinces: mapData?.provinces.length || 0,
    topProvinces: mapData?.provinces.slice(0, 3) || [],
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Globe className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Participant Distribution</h3>
              <p className="text-sm text-muted-foreground">Loading map data...</p>
            </div>
          </div>
          <div className="h-[400px] bg-sky-50 rounded-xl animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-teal-100 rounded-lg">
            <Globe className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Participant Distribution</h3>
            <p className="text-sm text-muted-foreground">Verified participants from across Indonesia</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <div className="text-center px-4">
            <p className="text-3xl font-bold text-teal-600">{stats.totalParticipants}</p>
            <p className="text-sm text-muted-foreground">Total Participants</p>
          </div>
          <div className="text-center px-4 border-l">
            <p className="text-3xl font-bold text-teal-600">{stats.totalProvinces}</p>
            <p className="text-sm text-muted-foreground">Provinces</p>
          </div>
          <div className="flex flex-wrap gap-2 ml-auto">
            {stats.topProvinces.map((p, i) => (
              <Badge key={i} variant="outline" className="bg-white">
                <MapPin className="w-3 h-3 mr-1" />
                {p.name}: {p.count}
              </Badge>
            ))}
          </div>
        </div>

        {/* Map Container */}
        <div className="relative bg-gradient-to-b from-sky-50 to-sky-100 rounded-xl overflow-hidden">
          {/* SVG Map Background */}
          <div className="w-full h-[400px] md:h-[500px]">
            <svg
              viewBox="0 0 1875 750"
              className="w-full h-full"
              style={{ maxHeight: "500px" }}
            >
              {/* Indonesia map as image background */}
              <image
                href="/indonesia-map.svg"
                width="1875"
                height="750"
                className="opacity-60"
              />
              
              {/* Debug: test marker to verify SVG rendering works */}
              <circle cx="500" cy="400" r="20" fill="red" />
              
              {/* Participant markers */}
              {provinceMarkers.length > 0 && provinceMarkers.map((marker) => {
                const size = getMarkerSize(marker.count, maxCount)
                const color = getMarkerColor(marker.count, maxCount)
                
                return (
                  <g key={marker.id}>
                    {/* Outer glow */}
                    <circle
                      cx={marker.x}
                      cy={marker.y}
                      r={size + 4}
                      fill={color}
                      opacity={0.3}
                    />
                    {/* Main marker */}
                    <circle
                      cx={marker.x}
                      cy={marker.y}
                      r={size}
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="cursor-pointer transition-all duration-200 hover:opacity-80"
                      onMouseEnter={(e) => {
                        setHoveredProvince(marker.id)
                        const rect = (e.target as SVGCircleElement).getBoundingClientRect()
                        setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top })
                      }}
                      onMouseLeave={() => setHoveredProvince(null)}
                    />
                    {/* Count label for large markers */}
                    {size > 16 && (
                      <text
                        x={marker.x}
                        y={marker.y + 4}
                        textAnchor="middle"
                        fill="white"
                        fontSize={size > 20 ? 12 : 10}
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        {marker.count}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Tooltip */}
          {hoveredProvince && (
            <div
              className="fixed z-50 bg-white px-3 py-2 rounded-lg shadow-lg border text-sm pointer-events-none"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y - 50,
                transform: "translateX(-50%)",
              }}
            >
              {(() => {
                const info = getProvinceInfo(hoveredProvince)
                return info ? (
                  <>
                    <p className="font-semibold">{info.name}</p>
                    <p className="text-teal-600">{info.count} participants</p>
                  </>
                ) : null
              })()}
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm">
            <p className="text-xs font-medium mb-2">Participants</p>
            <div className="flex items-center gap-1">
              {[8, 12, 16, 20, 24].map((size, i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: getMarkerColor((i + 1) * 10, 50),
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Few</span>
              <span>Many</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
