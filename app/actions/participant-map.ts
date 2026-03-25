"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { deriveProvinceFromInstitution, INDONESIA_PROVINCES } from "@/lib/data/indonesia-provinces"

export interface ProvinceDistribution {
  provinceId: string
  provinceName: string
  count: number
  coordinates: [number, number]
}

export interface ParticipantMapData {
  provinces: ProvinceDistribution[]
  totalParticipants: number
  unknownLocation: number
}

/**
 * Get participant distribution by province for verified (paid) orders only
 * Derives province from institution name
 */
export async function getParticipantDistribution(): Promise<ParticipantMapData> {
  const supabase = createAdminClient()

  // Get all paid orders with institution info
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, institution, full_name")
    .eq("status", "paid")

  console.log("[v0] Participant map - paid orders count:", orders?.length || 0)
  console.log("[v0] Participant map - sample institutions:", orders?.slice(0, 5).map(o => o.institution))

  if (error) {
    console.error("[v0] Error fetching orders for map:", error)
    return {
      provinces: [],
      totalParticipants: 0,
      unknownLocation: 0,
    }
  }

  // Count participants by province
  const provinceCounts = new Map<string, number>()
  let unknownCount = 0

  for (const order of orders || []) {
    const province = deriveProvinceFromInstitution(order.institution)
    
    console.log("[v0] Institution:", order.institution, "-> Province:", province?.name || "UNKNOWN")
    
    if (province) {
      const currentCount = provinceCounts.get(province.id) || 0
      provinceCounts.set(province.id, currentCount + 1)
    } else {
      unknownCount++
    }
  }

  // Build province distribution array
  const provinces: ProvinceDistribution[] = []
  
  for (const [provinceId, count] of provinceCounts.entries()) {
    const province = INDONESIA_PROVINCES.find(p => p.id === provinceId)
    if (province) {
      provinces.push({
        provinceId: province.id,
        provinceName: province.name,
        count,
        coordinates: province.coordinates,
      })
    }
  }

  // Sort by count descending
  provinces.sort((a, b) => b.count - a.count)

  return {
    provinces,
    totalParticipants: orders?.length || 0,
    unknownLocation: unknownCount,
  }
}
