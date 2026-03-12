"use client"

import { useState, useEffect } from "react"
import { getAllEventQuotasWithStatus, updateEventQuota, type QuotaStatus } from "@/app/actions/get-event-quotas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, AlertCircle, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

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

  const getStatusBg = (quota: QuotaStatus) => {
    if (quota.is_sold_out) return "bg-red-50"
    if (quota.is_low_stock) return "bg-amber-50"
    return "bg-green-50"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin" className="text-primary hover:underline text-sm">
              Admin Dashboard
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">Event Quotas</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Event Quota Management</h1>
          <p className="text-muted-foreground">
            Manage the maximum capacity for each event. Monitor registrations and adjust quotas as needed.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quotas.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active events tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quotas.reduce((sum, q) => sum + q.max_capacity, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all events</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Registered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quotas.reduce((sum, q) => sum + q.registered_count, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {quotas.length > 0
                  ? `${Math.round((quotas.reduce((sum, q) => sum + q.registered_count, 0) / quotas.reduce((sum, q) => sum + q.max_capacity, 0)) * 100)}% utilization`
                  : "0% utilization"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading quotas...</p>
              </div>
            </CardContent>
          </Card>
        ) : quotas.length === 0 ? (
          <Card>
            <CardContent className="py-12 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-muted-foreground" />
                <p className="text-muted-foreground">No event quotas found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Quotas Table */
          <div className="space-y-4">
            {quotas.map((quota) => (
              <Card key={quota.event_id} className={`${getStatusBg(quota)} border`}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1">{quota.event_name}</h3>
                        <p className="text-sm text-muted-foreground">Event ID: {quota.event_id}</p>
                      </div>
                      <div className={`text-sm font-bold ${getStatusColor(quota)}`}>
                        {quota.is_sold_out
                          ? "SOLD OUT"
                          : quota.is_low_stock
                            ? "LOW STOCK"
                            : "AVAILABLE"}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Registration Progress</span>
                        <span className="font-semibold">
                          {quota.registered_count} / {quota.max_capacity}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            quota.is_sold_out
                              ? "bg-red-500"
                              : quota.is_low_stock
                                ? "bg-amber-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min((quota.registered_count / quota.max_capacity) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {quota.percentage_filled}% filled • {quota.available_seats} seats available
                      </div>
                    </div>

                    {/* Edit Section */}
                    <div className="flex items-end gap-3 pt-2 flex-wrap">
                      {editingId === quota.event_id ? (
                        <>
                          <div className="flex-1 min-w-0 flex items-end gap-2">
                            <div className="flex-1">
                              <Label htmlFor={`capacity-${quota.event_id}`} className="text-xs mb-1 block">
                                New Capacity
                              </Label>
                              <Input
                                id={`capacity-${quota.event_id}`}
                                type="number"
                                min="0"
                                value={editingValue ?? ""}
                                onChange={(e) => setEditingValue(parseInt(e.target.value) || 0)}
                                className="w-full"
                              />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSaveQuota(quota.event_id)}
                            disabled={isSaving}
                            className="whitespace-nowrap"
                          >
                            {isSaving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditCancel}
                            disabled={isSaving}
                            className="whitespace-nowrap"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEditStart(quota)}>
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
    </div>
  )
}
