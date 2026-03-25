"use client"

import { useEffect, useState } from "react"
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps"
import { Tooltip } from "react-tooltip"
import { getParticipantDistribution, type ParticipantMapData } from "@/app/actions/participant-map"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Users, Globe } from "lucide-react"

// Indonesia GeoJSON - served from public folder for reliability
const INDONESIA_PROVINCES_URL = "/indonesia-provinces.geojson"

// Color scale for heat map
function getProvinceColor(count: number, maxCount: number): string {
  if (count === 0) return "#e5e7eb" // gray-200
  
  const intensity = Math.min(count / Math.max(maxCount, 1), 1)
  
  // Gradient from light teal to dark teal (matching site theme)
  if (intensity < 0.2) return "#ccfbf1" // teal-100
  if (intensity < 0.4) return "#5eead4" // teal-300
  if (intensity < 0.6) return "#14b8a6" // teal-500
  if (intensity < 0.8) return "#0d9488" // teal-600
  return "#0f766e" // teal-700
}

export function IndonesiaParticipantMap() {
  const [mapData, setMapData] = useState<ParticipantMapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tooltipContent, setTooltipContent] = useState("")
  const [position, setPosition] = useState({ coordinates: [118, -2] as [number, number], zoom: 1 })

  const [geoError, setGeoError] = useState(false)

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

  const maxCount = mapData?.provinces.reduce((max, p) => Math.max(max, p.count), 0) || 1

  // Map province name variations to our data
  function getProvinceData(geoName: string) {
    if (!mapData) return null
    
    // Normalize name for matching
    const normalizedGeo = geoName.toLowerCase().trim()
    
    return mapData.provinces.find(p => {
      const normalizedProvince = p.provinceName.toLowerCase()
      return normalizedGeo.includes(normalizedProvince) || 
             normalizedProvince.includes(normalizedGeo) ||
             // Handle common variations
             (normalizedGeo.includes("jakarta") && p.provinceName === "DKI Jakarta") ||
             (normalizedGeo.includes("yogyakarta") && p.provinceName === "DI Yogyakarta") ||
             (normalizedGeo.includes("d.i. yogyakarta") && p.provinceName === "DI Yogyakarta")
    })
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  const topProvinces = mapData?.provinces.slice(0, 5) || []

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Participant Distribution</CardTitle>
            <CardDescription>
              Verified participants from across Indonesia
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b bg-muted/30">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{mapData?.totalParticipants || 0}</p>
            <p className="text-xs text-muted-foreground">Total Participants</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-teal-600">{mapData?.provinces.length || 0}</p>
            <p className="text-xs text-muted-foreground">Provinces</p>
          </div>
          <div className="text-center md:col-span-2">
            <div className="flex flex-wrap justify-center gap-2">
              {topProvinces.slice(0, 3).map((p) => (
                <span key={p.provinceId} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-xs">
                  <MapPin className="w-3 h-3" />
                  {p.provinceName}: {p.count}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="relative bg-gradient-to-b from-sky-50 to-sky-100">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 1200,
              center: [118, -2],
            }}
            style={{ width: "100%", height: "auto", aspectRatio: "16/9" }}
          >
            <ZoomableGroup
              center={position.coordinates}
              zoom={position.zoom}
              onMoveEnd={({ coordinates, zoom }) => setPosition({ coordinates: coordinates as [number, number], zoom })}
              minZoom={0.8}
              maxZoom={4}
            >
              <Geographies geography={INDONESIA_PROVINCES_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    // Handle different GeoJSON property formats - this file uses "PROVINSI"
                    const provinceName = geo.properties?.PROVINSI || geo.properties?.Propinsi || geo.properties?.NAME_1 || geo.properties?.Provinsi || geo.properties?.name || ""
                    const provinceData = getProvinceData(provinceName)
                    const count = provinceData?.count || 0
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        data-tooltip-id="province-tooltip"
                        data-tooltip-content={`${provinceName}: ${count} participant${count !== 1 ? 's' : ''}`}
                        onMouseEnter={() => {
                          setTooltipContent(`${provinceName}: ${count} participant${count !== 1 ? 's' : ''}`)
                        }}
                        onMouseLeave={() => {
                          setTooltipContent("")
                        }}
                        style={{
                          default: {
                            fill: getProvinceColor(count, maxCount),
                            stroke: "#fff",
                            strokeWidth: 0.5,
                            outline: "none",
                          },
                          hover: {
                            fill: "#f97316", // orange-500
                            stroke: "#fff",
                            strokeWidth: 1,
                            outline: "none",
                            cursor: "pointer",
                          },
                          pressed: {
                            fill: "#ea580c", // orange-600
                            outline: "none",
                          },
                        }}
                      />
                    )
                  })
                }
              </Geographies>

              {/* Markers for provinces with participants */}
              {mapData?.provinces
                .filter(p => p.count > 0)
                .map((province) => (
                  <Marker key={province.provinceId} coordinates={province.coordinates}>
                    <circle
                      r={Math.max(3, Math.min(8, Math.sqrt(province.count) * 2))}
                      fill="#0d9488"
                      fillOpacity={0.7}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  </Marker>
                ))}
            </ZoomableGroup>
          </ComposableMap>
          
          <Tooltip id="province-tooltip" className="z-50" />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <p className="text-xs font-semibold mb-2">Participants</p>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "#e5e7eb" }} />
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "#ccfbf1" }} />
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "#5eead4" }} />
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "#14b8a6" }} />
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "#0f766e" }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0</span>
              <span>Many</span>
            </div>
          </div>

          {/* Zoom controls hint */}
          <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-white/80 rounded px-2 py-1">
            Scroll to zoom, drag to pan
          </div>
        </div>

        {/* Top Provinces List */}
        {topProvinces.length > 0 && (
          <div className="p-4 border-t">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Top Provinces
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
              {topProvinces.map((province, index) => (
                <div
                  key={province.provinceId}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{province.provinceName}</p>
                    <p className="text-xs text-muted-foreground">{province.count} participants</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
