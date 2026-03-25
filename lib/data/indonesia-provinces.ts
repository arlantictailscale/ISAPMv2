/**
 * Indonesia Province Data with Institution Keyword Mapping
 * Used to auto-derive province from institution names
 */

export interface Province {
  id: string
  name: string
  // Keywords to match in institution names (cities, universities, hospitals)
  keywords: string[]
  // Coordinates for map centering (capital city)
  coordinates: [number, number] // [longitude, latitude]
}

export const INDONESIA_PROVINCES: Province[] = [
  {
    id: "ID-AC",
    name: "Aceh",
    keywords: ["aceh", "banda aceh", "lhokseumawe", "langsa", "unsyiah", "usk"],
    coordinates: [95.3191, 5.5483],
  },
  {
    id: "ID-SU",
    name: "Sumatera Utara",
    keywords: ["medan", "sumatera utara", "sumut", "usu", "binjai", "pematangsiantar", "tebing tinggi"],
    coordinates: [98.6722, 3.5952],
  },
  {
    id: "ID-SB",
    name: "Sumatera Barat",
    keywords: ["padang", "sumatera barat", "sumbar", "unand", "bukittinggi", "payakumbuh"],
    coordinates: [100.3543, -0.9471],
  },
  {
    id: "ID-RI",
    name: "Riau",
    keywords: ["pekanbaru", "riau", "unri", "dumai"],
    coordinates: [101.4478, 0.5071],
  },
  {
    id: "ID-JA",
    name: "Jambi",
    keywords: ["jambi", "unja"],
    coordinates: [103.6131, -1.6101],
  },
  {
    id: "ID-SS",
    name: "Sumatera Selatan",
    keywords: ["palembang", "sumatera selatan", "sumsel", "unsri", "sriwijaya"],
    coordinates: [104.7458, -2.9761],
  },
  {
    id: "ID-BB",
    name: "Kepulauan Bangka Belitung",
    keywords: ["bangka", "belitung", "pangkalpinang"],
    coordinates: [106.1113, -2.1316],
  },
  {
    id: "ID-BE",
    name: "Bengkulu",
    keywords: ["bengkulu", "unib"],
    coordinates: [102.2655, -3.7928],
  },
  {
    id: "ID-LA",
    name: "Lampung",
    keywords: ["lampung", "bandar lampung", "unila"],
    coordinates: [105.2583, -5.4500],
  },
  {
    id: "ID-KR",
    name: "Kepulauan Riau",
    keywords: ["kepulauan riau", "kepri", "batam", "tanjungpinang"],
    coordinates: [104.0305, 1.0456],
  },
  {
    id: "ID-JK",
    name: "DKI Jakarta",
    keywords: ["jakarta", "dki", "ui", "universitas indonesia", "rscm", "dharmais", "fatmawati", "persahabatan", "cipto"],
    coordinates: [106.8456, -6.2088],
  },
  {
    id: "ID-JB",
    name: "Jawa Barat",
    keywords: ["bandung", "jawa barat", "jabar", "itb", "unpad", "bogor", "ipb", "depok", "bekasi", "karawang", "cirebon", "sukabumi", "tasikmalaya", "garut", "hasan sadikin"],
    coordinates: [107.6191, -6.9175],
  },
  {
    id: "ID-JT",
    name: "Jawa Tengah",
    keywords: ["semarang", "jawa tengah", "jateng", "undip", "uns", "solo", "surakarta", "pekalongan", "tegal", "magelang", "purwokerto", "unsoed", "cilacap", "kudus", "salatiga", "kariadi"],
    coordinates: [110.4203, -7.0051],
  },
  {
    id: "ID-YO",
    name: "DI Yogyakarta",
    keywords: ["yogyakarta", "jogja", "jogjakarta", "ugm", "uny", "uii", "sardjito"],
    coordinates: [110.3695, -7.7956],
  },
  {
    id: "ID-JI",
    name: "Jawa Timur",
    keywords: ["surabaya", "jawa timur", "jatim", "unair", "its", "malang", "brawijaya", "ub", "kediri", "madiun", "mojokerto", "pasuruan", "probolinggo", "banyuwangi", "jember", "unej", "blitar", "tulungagung", "soetomo", "dr. soetomo"],
    coordinates: [112.7508, -7.2575],
  },
  {
    id: "ID-BT",
    name: "Banten",
    keywords: ["banten", "tangerang", "serang", "cilegon", "untirta", "serpong"],
    coordinates: [106.1505, -6.1202],
  },
  {
    id: "ID-BA",
    name: "Bali",
    keywords: ["bali", "denpasar", "udayana", "unud", "sanglah"],
    coordinates: [115.2126, -8.6705],
  },
  {
    id: "ID-NB",
    name: "Nusa Tenggara Barat",
    keywords: ["lombok", "mataram", "ntb", "nusa tenggara barat", "unram", "sumbawa"],
    coordinates: [117.1536, -8.6529],
  },
  {
    id: "ID-NT",
    name: "Nusa Tenggara Timur",
    keywords: ["kupang", "ntt", "nusa tenggara timur", "undana", "flores", "ende"],
    coordinates: [123.5977, -10.1632],
  },
  {
    id: "ID-KB",
    name: "Kalimantan Barat",
    keywords: ["pontianak", "kalimantan barat", "kalbar", "untan"],
    coordinates: [109.3425, -0.0263],
  },
  {
    id: "ID-KT",
    name: "Kalimantan Tengah",
    keywords: ["palangkaraya", "kalimantan tengah", "kalteng"],
    coordinates: [113.9213, -1.6815],
  },
  {
    id: "ID-KS",
    name: "Kalimantan Selatan",
    keywords: ["banjarmasin", "kalimantan selatan", "kalsel", "unlam", "banjarbaru"],
    coordinates: [114.5943, -3.3194],
  },
  {
    id: "ID-KI",
    name: "Kalimantan Timur",
    keywords: ["samarinda", "kalimantan timur", "kaltim", "unmul", "balikpapan"],
    coordinates: [117.1536, -0.5022],
  },
  {
    id: "ID-KU",
    name: "Kalimantan Utara",
    keywords: ["tarakan", "kalimantan utara", "kaltara"],
    coordinates: [117.3667, 3.3000],
  },
  {
    id: "ID-SA",
    name: "Sulawesi Utara",
    keywords: ["manado", "sulawesi utara", "sulut", "unsrat", "bitung"],
    coordinates: [124.8455, 1.4748],
  },
  {
    id: "ID-ST",
    name: "Sulawesi Tengah",
    keywords: ["palu", "sulawesi tengah", "sulteng", "untad"],
    coordinates: [119.8707, -0.8917],
  },
  {
    id: "ID-SN",
    name: "Sulawesi Selatan",
    keywords: ["makassar", "sulawesi selatan", "sulsel", "unhas", "hasanuddin", "ujung pandang", "pare-pare"],
    coordinates: [119.4327, -5.1477],
  },
  {
    id: "ID-SG",
    name: "Sulawesi Tenggara",
    keywords: ["kendari", "sulawesi tenggara", "sultra", "uho"],
    coordinates: [122.5150, -3.9675],
  },
  {
    id: "ID-GO",
    name: "Gorontalo",
    keywords: ["gorontalo", "ung"],
    coordinates: [123.0568, 0.5435],
  },
  {
    id: "ID-SR",
    name: "Sulawesi Barat",
    keywords: ["mamuju", "sulawesi barat", "sulbar"],
    coordinates: [119.3908, -2.6747],
  },
  {
    id: "ID-MA",
    name: "Maluku",
    keywords: ["ambon", "maluku", "unpatti"],
    coordinates: [128.1856, -3.6489],
  },
  {
    id: "ID-MU",
    name: "Maluku Utara",
    keywords: ["ternate", "maluku utara", "malut", "tidore"],
    coordinates: [127.3886, 0.7893],
  },
  {
    id: "ID-PA",
    name: "Papua",
    keywords: ["jayapura", "papua", "uncen", "cenderawasih"],
    coordinates: [140.7018, -2.5337],
  },
  {
    id: "ID-PB",
    name: "Papua Barat",
    keywords: ["manokwari", "papua barat", "sorong"],
    coordinates: [134.0868, -1.3361],
  },
]

/**
 * Derive province from institution name using keyword matching
 */
export function deriveProvinceFromInstitution(institution: string | null | undefined): Province | null {
  if (!institution) return null
  
  const normalizedInstitution = institution.toLowerCase().trim()
  
  // Try to find a matching province based on keywords
  for (const province of INDONESIA_PROVINCES) {
    for (const keyword of province.keywords) {
      if (normalizedInstitution.includes(keyword.toLowerCase())) {
        return province
      }
    }
  }
  
  return null
}

/**
 * Get province by ID
 */
export function getProvinceById(id: string): Province | undefined {
  return INDONESIA_PROVINCES.find(p => p.id === id)
}

/**
 * Get all province options for dropdowns
 */
export function getProvinceOptions(): { value: string; label: string }[] {
  return INDONESIA_PROVINCES.map(p => ({
    value: p.id,
    label: p.name,
  })).sort((a, b) => a.label.localeCompare(b.label))
}
