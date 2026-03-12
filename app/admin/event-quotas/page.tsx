"use client"

import { useState, useEffect } from "react"
import { getAllEventQuotasWithStatus, updateEventQuota, type QuotaStatus } from "@/app/actions/get-event-quotas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, BarChart3, RefreshCw, Users, TrendingUp, AlertCircle, CheckCircle2, Edit2, X, Save } from "lucide-react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { AdminDropdownNav } from "@/components/admin-dropdown-nav"

export default function AdminEventQuotasPage() {
  const [quotas, setQuotas] = useState<QuotaStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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
        // Reload quotas to reflect changes
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

  const getStatusColor = (quota: QuotaStatus) => {
    if (quota.is_sold_out) return "text-red-600"
    if (quota.is_low_stock) return "text-amber-600"
    return "text-green-600"
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
        {/* Page Header */}
        <section className="py-8 px-4 bg-gradient-to-br from-violet-500/10 via-primary/5 to-cyan-500/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-primary text-white shrink-0">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold">Event Quota Management</h1>
                  <p className="text-muted-foreground">Monitor registrations and manage capacity for each event</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={loadQuotas} className="bg-transparent shrink-0 self-start sm:self-auto">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Admin Nav */}
            <AdminDropdownNav />

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Events</p>
                      <p className="text-2xl font-bold">{quotas.length}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Active events tracked</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                      <TrendingUp className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Capacity</p>
                      <p className="text-2xl font-bold">{totalCapacity.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Across all events</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Registered</p>
                      <p className="text-2xl font-bold">{totalRegistered.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{overallUtilization}% utilization</p>
                </CardContent>
              </Card>
            </div>

            {/* Quota Cards */}
            {quotas.length === 0 ? (
              <Card>
                <CardContent className="py-12 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No event quotas found</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {quotas.map((quota) => (
                  <Card key={quota.event_id} className="overflow-hidden">
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4">
                        {/* Title Row */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg leading-tight">{quota.event_name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Event ID: {quota.event_id}</p>
                          </div>
                          <div className={`flex items-center gap-1.5 text-sm font-bold shrink-0 ${getStatusColor(quota)}`}>
                            {quota.is_sold_out ? (
                              <AlertCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            {quota.is_sold_out ? "SOLD OUT" : quota.is_low_stock ? "LOW STOCK" : "AVAILABLE"}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Registration Progress</span>
                            <span className="font-semibold tabular-nums">
                              {quota.registered_count} / {quota.max_capacity}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(quota)}`}
                              style={{ width: `${Math.min((quota.registered_count / quota.max_capacity) * 100, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {quota.percentage_filled}% filled &bull; {quota.available_seats} seats available
                          </p>
                        </div>

                        {/* Edit Section */}
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          {editingId === quota.event_id ? (
                            <>
                              <Input
                                type="number"
                                min="0"
                                value={editingValue ?? ""}
                                onChange={(e) => setEditingValue(parseInt(e.target.value) || 0)}
                                className="w-32"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveQuota(quota.event_id)}
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                ) : (
                                  <Save className="w-3.5 h-3.5 mr-1.5" />
                                )}
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleEditCancel}
                                disabled={isSaving}
                                className="bg-transparent"
                              >
                                <X className="w-3.5 h-3.5 mr-1.5" />
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditStart(quota)}
                              className="bg-transparent"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                              Edit Capacity
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
