export function getEventIcon(type: string) {
  switch (type) {
    case "cpd":
      return "GraduationCap"
    case "workshop":
      return "Wrench"
    case "symposium":
      return "Users"
    default:
      return "Calendar"
  }
}

export function getEventColorScheme(type: string) {
  switch (type) {
    case "cpd":
      return {
        gradient: "from-purple-600 to-purple-800",
        bg: "bg-purple-50",
        icon: "text-purple-600",
        badge: "bg-purple-100 text-purple-700",
      }
    case "workshop":
      return {
        gradient: "from-orange-500 to-orange-700",
        bg: "bg-orange-50",
        icon: "text-orange-600",
        badge: "bg-orange-100 text-orange-700",
      }
    case "symposium":
      return {
        gradient: "from-teal-600 to-teal-800",
        bg: "bg-teal-50",
        icon: "text-teal-600",
        badge: "bg-teal-100 text-teal-700",
      }
    default:
      return {
        gradient: "from-slate-600 to-slate-800",
        bg: "bg-slate-50",
        icon: "text-slate-600",
        badge: "bg-slate-100 text-slate-700",
      }
  }
}

export function formatEventDate(startDate: string | null, endDate: string | null): string {
  if (!startDate) return "TBA"
  const start = new Date(startDate)
  if (!endDate || startDate === endDate) {
    return start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  }
  const end = new Date(endDate)
  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString("en-US", { month: "long" })} ${start.getDate()}-${end.getDate()}, ${end.getFullYear()}`
  }
  return `${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
}

export function formatEventTime(startTime: string | null, endTime: string | null, timezone: string | null): string {
  if (!startTime) return "TBA"
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    return `${hours}:${minutes}`
  }
  const tz = timezone || "WIB"
  if (!endTime) return `${formatTime(startTime)} ${tz}`
  return `${formatTime(startTime)} - ${formatTime(endTime)} ${tz}`
}

export function getEventTypeFromId(eventId: string): "cpd" | "workshop" | "symposium" {
  const id = eventId?.toLowerCase()
  if (id === "cpd") return "cpd"
  if (id === "symposium") return "symposium"
  if (id?.startsWith("ws")) return "workshop"
  return "workshop"
}

export function isEventItem(item: any): boolean {
  const itemType = item.item_type?.toLowerCase()
  const eventId = item.event_id?.toLowerCase()
  if (itemType === "event") {
    return eventId && (eventId.startsWith("ws") || eventId === "cpd" || eventId === "symposium")
  }
  return ["workshop", "cpd", "symposium"].includes(itemType)
}
