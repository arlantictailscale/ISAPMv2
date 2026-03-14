"use client"

import { useState, useEffect } from "react"
import { getAllEventQuotasWithStatus, updateEventQuota, type QuotaStatus } from "@/app/actions/get-event-quotas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Loader2, BarChart3, RefreshCw, Users, TrendingUp, AlertCircle, CheckCircle2, Edit2, X, Save, FileSpreadsheet, Upload } from "lucide-react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { AdminDropdownNav } from "@/components/admin-dropdown-nav"
import { createClient } from "@/lib/supabase/client"
import * as XLSX from "xlsx"
import { format } from "date-fns"

export default function AdminEventQuotasPage() {
  const [quotas, setQuotas] = useState<QuotaStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadQuotas()
  }, [])

  const loadQuotas = async () => {
    setIsLoading(true)
    try {
      const data = await getAllEventQuotasWithStatus()
      setQuotas(data)
    } catch (err) {
      console.error("[v0] Error loading quotas:", err)
      toast.error("Failed to load quotas")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditStart = (quota: QuotaStatus) => {
    setEditingId(quota.event_id)
    setEditingValue(quota.max_capacity)
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditingValue(null)
  }

  const handleSaveQuota = async (eventId: string) => {
    if (editingValue === null || editingValue < 0) {
      toast.error("Please enter a valid capacity")
      return
    }

    setIsSaving(true)
    try {
      const success = await updateEventQuota(eventId, editingValue)
      if (success) {
        toast.success("Quota updated successfully")
        setEditingId(null)
        setEditingValue(null)
        await loadQuotas()
      } else {
        toast.error("Failed to update quota")
      }
    } catch (err) {
      console.error("[v0] Error saving quota:", err)
      toast.error("Error updating quota")
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportExcel = () => {
    if (quotas.length === 0) {
      toast.error("No data to export")
      return
    }

    const exportData = quotas.map((q) => ({
      "Event Name": q.event_name,
      "Event ID": q.event_id,
      "Max Capacity": q.max_capacity,
      "Registered": q.registered_count,
      "Available": q.available_seats,
      "Utilization %": q.percentage_filled,
      "Status": q.is_sold_out ? "SOLD OUT" : q.is_low_stock ? "LOW STOCK" : "AVAILABLE",
    }))

    // Add summary row
    const totalCapacity = quotas.reduce((sum, q) => sum + q.max_capacity, 0)
    const totalRegistered = quotas.reduce((sum, q) => sum + q.registered_count, 0)
    exportData.push({
      "Event Name": "TOTAL",
      "Event ID": "",
      "Max Capacity": totalCapacity,
      "Registered": totalRegistered,
      "Available": totalCapacity - totalRegistered,
      "Utilization %": totalCapacity > 0 ? Math.round((totalRegistered / totalCapacity) * 100) : 0,
      "Status": "",
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Event Quotas")
    XLSX.writeFile(wb, `event-quotas-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`)
    toast.success("Excel file exported successfully")
  }

  const handleSyncGoogleSheets = async () => {
    setIsSyncing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Please log in to sync data")
        return
      }

      const response = await fetch("/api/admin/sync-event-quotas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ quotas }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Sync failed")
      }

      toast.success("Event quotas synced to Google Sheets!")
    } catch (err: any) {
      console.error("[v0] Sync error:", err)
      toast.error(err.message || "Failed to sync to Google Sheets")
    } finally {
      setIsSyncing(false)
    }
  }

  const getStatusBadge = (quota: QuotaStatus) => {
    if (quota.is_sold_out) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700"><AlertCircle className="w-3 h-3" />Sold Out</span>
    }
    if (quota.is_low_stock) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700"><AlertCircle className="w-3 h-3" />Low</span>
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3" />OK</span>
  }

  const getProgressColor = (quota: QuotaStatus) => {
    if (quota.is_sold_out) return "bg-red-500"
    if (quota.is_low_stock) return "bg-amber-500"
    return "bg-green-500"
  }

  const totalCapacity = quotas.reduce((sum, q) => sum + q.max_capacity, 0)
  const totalRegistered = quotas.reduce((sum, q) => sum + q.registered_count, 0)
  const overallUtilization = totalCapacity > 0 ? Math.round((totalRegistered / totalCapacity) * 100) : 0

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading event quotas...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20">
        {/* Compact Header */}
        <section className="py-6 px-4 bg-gradient-to-br from-violet-500/10 via-primary/5 to-cyan-500/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-primary text-white shrink-0">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold">Event Quota Management</h1>
                  <p className="text-sm text-muted-foreground">Monitor registrations and manage capacity</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={handleExportExcel} className="bg-transparent">
                  <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handleSyncGoogleSheets} disabled={isSyncing} className="bg-transparent">
                  {isSyncing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
                  Sync Sheet
                </Button>
                <Button variant="outline" size="sm" onClick={loadQuotas} className="bg-transparent">
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-6 px-4">
          <div className="max-w-7xl mx-auto space-y-6">
            <AdminDropdownNav />

            {/* Compact Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Events</span>
                  <span className="ml-auto text-xl font-bold">{quotas.length}</span>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-600" />
                  <span className="text-sm text-muted-foreground">Capacity</span>
                  <span className="ml-auto text-xl font-bold">{totalCapacity}</span>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Registered</span>
                  <span className="ml-auto text-xl font-bold">{totalRegistered} <span className="text-sm font-normal text-muted-foreground">({overallUtilization}%)</span></span>
                </div>
              </Card>
            </div>

            {/* Compact Table View */}
            {quotas.length === 0 ? (
              <Card>
                <CardContent className="py-8 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-muted-foreground" />
                    <p className="text-muted-foreground">No event quotas found</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Event</TableHead>
                        <TableHead className="text-center w-20">Status</TableHead>
                        <TableHead className="text-center w-28">Progress</TableHead>
                        <TableHead className="text-right w-24">Registered</TableHead>
                        <TableHead className="text-right w-20">Capacity</TableHead>
                        <TableHead className="text-right w-20">Available</TableHead>
                        <TableHead className="w-32">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotas.map((quota) => (
                        <TableRow key={quota.event_id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{quota.event_name}</p>
                              <p className="text-xs text-muted-foreground">{quota.event_id}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{getStatusBadge(quota)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${getProgressColor(quota)}`}
                                  style={{ width: `${Math.min(quota.percentage_filled, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8">{quota.percentage_filled}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{quota.registered_count}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {editingId === quota.event_id ? (
                              <Input
                                type="number"
                                min="0"
                                value={editingValue ?? ""}
                                onChange={(e) => setEditingValue(parseInt(e.target.value) || 0)}
                                className="w-20 h-7 text-right text-sm"
                                autoFocus
                              />
                            ) : (
                              quota.max_capacity
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{quota.available_seats}</TableCell>
                          <TableCell>
                            {editingId === quota.event_id ? (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleSaveQuota(quota.event_id)} disabled={isSaving}>
                                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-green-600" />}
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleEditCancel} disabled={isSaving}>
                                  <X className="w-3.5 h-3.5 text-red-600" />
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleEditStart(quota)}>
                                <Edit2 className="w-3.5 h-3.5 mr-1" />
                                Edit
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
