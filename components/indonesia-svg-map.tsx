"use client"

import { useEffect, useState, useRef } from "react"
import { Globe, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getParticipantDistribution, type ParticipantMapData } from "@/app/actions/participant-map"
import { INDONESIA_PROVINCES } from "@/lib/data/indonesia-provinces"

// Color scale for participant counts
const getProvinceColor = (count: number, maxCount: number): string => {
  if (count === 0) return "#e2e8f0" // slate-200 for empty provinces
  
  const intensity = Math.min(count / Math.max(maxCount, 1), 1)
  
  if (intensity < 0.2) return "#99f6e4" // teal-200
  if (intensity < 0.4) return "#5eead4" // teal-300
  if (intensity < 0.6) return "#2dd4bf" // teal-400
  if (intensity < 0.8) return "#14b8a6" // teal-500
  return "#0d9488" // teal-600
}

export function IndonesiaSvgMap() {
  const [mapData, setMapData] = useState<ParticipantMapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const [svgContent, setSvgContent] = useState<string>("")

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

  useEffect(() => {
    // Load SVG content
    fetch("/indonesia-map.svg")
      .then(res => res.text())
      .then(svg => setSvgContent(svg))
      .catch(err => console.error("Failed to load SVG:", err))
  }, [])

  // Create a map of province ID to participant count
  const provinceCountMap = new Map<string, number>()
  const maxCount = mapData?.provinces.reduce((max, p) => Math.max(max, p.count), 0) || 1

  mapData?.provinces.forEach(p => {
    // Find province ID from name
    const province = INDONESIA_PROVINCES.find(prov => 
      prov.name.toLowerCase() === p.name.toLowerCase()
    )
    if (province) {
      provinceCountMap.set(province.id, p.count)
    }
  })

  // Get province info for tooltip
  const getProvinceInfo = (provinceId: string) => {
    const province = INDONESIA_PROVINCES.find(p => p.id === provinceId)
    const count = provinceCountMap.get(provinceId) || 0
    return { name: province?.name || provinceId, count }
  }

  // Apply colors to SVG paths
  useEffect(() => {
    if (!svgContent || !svgContainerRef.current) return

    const container = svgContainerRef.current
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgContent, "image/svg+xml")
    const svgElement = svgDoc.querySelector("svg")
    
    if (!svgElement) return

    // Style the SVG
    svgElement.setAttribute("width", "100%")
    svgElement.setAttribute("height", "100%")
    svgElement.style.maxHeight = "500px"

    // Color each province path
    const paths = svgElement.querySelectorAll("path[id^='ID-']")
    paths.forEach(path => {
      const id = path.getAttribute("id")
      if (id) {
        const count = provinceCountMap.get(id) || 0
        const color = getProvinceColor(count, maxCount)
        path.setAttribute("fill", color)
        path.setAttribute("stroke", "#ffffff")
        path.setAttribute("stroke-width", "0.5")
        path.setAttribute("data-province-id", id)
        path.style.cursor = "pointer"
        path.style.transition = "fill 0.2s ease, opacity 0.2s ease"
      }
    })

    // Clear and append
    container.innerHTML = ""
    container.appendChild(svgElement)

    // Add event listeners for hover
    const allPaths = container.querySelectorAll("path[data-province-id]")
    allPaths.forEach(path => {
      path.addEventListener("mouseenter", (e) => {
        const target = e.target as SVGPathElement
        const id = target.getAttribute("data-province-id")
        if (id) {
          setHoveredProvince(id)
          target.style.opacity = "0.8"
          target.setAttribute("stroke-width", "1.5")
        }
      })
      
      path.addEventListener("mousemove", (e) => {
        const mouseEvent = e as MouseEvent
        setTooltipPos({ x: mouseEvent.clientX, y: mouseEvent.clientY })
      })
      
      path.addEventListener("mouseleave", (e) => {
        const target = e.target as SVGPathElement
        setHoveredProvince(null)
        target.style.opacity = "1"
        target.setAttribute("stroke-width", "0.5")
      })
    })
  }, [svgContent, mapData, maxCount, provinceCountMap])

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
              <h2 className="text-xl font-bold">Participant Distribution</h2>
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
          <div className="h-[400px] bg-slate-100 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-teal-100 rounded-lg">
            <Globe className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Participant Distribution</h2>
            <p className="text-sm text-muted-foreground">Verified participants from across Indonesia</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-teal-600">{stats.totalParticipants}</p>
              <p className="text-sm text-muted-foreground">Total Participants</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-teal-600">{stats.totalProvinces}</p>
              <p className="text-sm text-muted-foreground">Provinces</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.topProvinces.map((p, i) => (
              <Badge key={i} variant="outline" className="bg-white">
                <MapPin className="w-3 h-3 mr-1" />
                {p.name}: {p.count}
              </Badge>
            ))}
          </div>
        </div>

        {/* Map Container */}
        <div className="relative bg-gradient-to-b from-sky-50 to-sky-100 rounded-lg overflow-hidden">
          <div 
            ref={svgContainerRef}
            className="w-full h-[400px] md:h-[500px] p-4"
          />

          {/* Tooltip */}
          {hoveredProvince && (
            <div 
              className="fixed z-50 px-3 py-2 bg-white rounded-lg shadow-lg border text-sm pointer-events-none"
              style={{ 
                left: tooltipPos.x + 10, 
                top: tooltipPos.y - 40,
              }}
            >
              <p className="font-semibold">{getProvinceInfo(hoveredProvince).name}</p>
              <p className="text-teal-600">{getProvinceInfo(hoveredProvince).count} participants</p>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
            <p className="text-xs font-medium mb-2">Participants</p>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#e2e8f0" }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#99f6e4" }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#5eead4" }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#2dd4bf" }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#14b8a6" }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#0d9488" }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>Many</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
