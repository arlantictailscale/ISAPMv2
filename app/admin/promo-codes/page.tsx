"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/cart/utils"
import { format } from "date-fns"
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Tag,
  Calendar,
  Users,
  Percent,
  DollarSign,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  BarChart3,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PromoCode {
  id: string
  code: string
  description: string | null
  discount_type: string
  discount_value: number
  max_uses: number | null
  current_uses: number
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
  created_by: string | null
  rules?: PromoCodeRule[]
  uses?: PromoCodeUse[]
}

interface PromoCodeRule {
  id: string
  promo_code_id: string
  event_slug: string
  event_label: string | null
  participant_type: string | null
  discount_type: string
  discount_value: number
}

interface PromoCodeUse {
  id: string
  promo_code_id: string
  user_id: string
  order_id: string
  discount_amount: number
  original_amount: number
  created_at: string
  user_email?: string
}

const EVENT_OPTIONS = [
  { value: "symposium", label: "Symposium" },
  { value: "workshop-pediatric-pain", label: "Workshop: Pediatric Essential Pain Management" },
  { value: "workshop-cancer-pain", label: "Workshop: Cancer Pain" },
  { value: "workshop-adjunct-therapy", label: "Workshop: Adjunct Therapy for Pain Management" },
  { value: "cpd-course", label: "CPD Course" },
  { value: "all", label: "All Events" },
]

const PARTICIPANT_OPTIONS = [
  { value: "all", label: "All Participants" },
  { value: "specialist", label: "Specialist Doctor" },
  { value: "gp", label: "General Practitioner" },
  { value: "nurse", label: "Nurse" },
  { value: "resident", label: "Resident" },
  { value: "student", label: "Student" },
]

export default function PromoCodesAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRulesDialogOpen, setIsRulesDialogOpen] = useState(false)
  const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 0,
    max_uses: "",
    starts_at: "",
    expires_at: "",
    is_active: true,
  })

  const [ruleFormData, setRuleFormData] = useState({
    event_slug: "",
    event_label: "",
    participant_type: "all",
    discount_type: "percentage",
    discount_value: 0,
  })

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  async function checkAdminAndFetch() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    setIsAdmin(true)
    await fetchPromoCodes()
  }

  async function fetchPromoCodes() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("promo_codes")
        .select(`
          *,
          rules:promo_code_rules(*),
          uses:promo_code_uses(*)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setPromoCodes(data || [])
    } catch (error) {
      console.error("Error fetching promo codes:", error)
      toast({
        title: "Error",
        description: "Failed to load promo codes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreatePromo() {
    if (!formData.code.trim()) {
      toast({ title: "Error", description: "Promo code is required", variant: "destructive" })
      return
    }

    setIsProcessing(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.from("promo_codes").insert({
        code: formData.code.toUpperCase().trim(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        starts_at: formData.starts_at || null,
        expires_at: formData.expires_at || null,
        is_active: formData.is_active,
        created_by: user?.id,
      })

      if (error) throw error

      toast({ title: "Success", description: "Promo code created successfully" })
      setIsCreateDialogOpen(false)
      resetForm()
      await fetchPromoCodes()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create promo code",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleUpdatePromo() {
    if (!selectedPromo) return

    setIsProcessing(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("promo_codes")
        .update({
          code: formData.code.toUpperCase().trim(),
          description: formData.description || null,
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
          starts_at: formData.starts_at || null,
          expires_at: formData.expires_at || null,
          is_active: formData.is_active,
        })
        .eq("id", selectedPromo.id)

      if (error) throw error

      toast({ title: "Success", description: "Promo code updated successfully" })
      setIsEditDialogOpen(false)
      resetForm()
      await fetchPromoCodes()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update promo code",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleDeletePromo() {
    if (!selectedPromo) return

    setIsProcessing(true)
    try {
      const supabase = createClient()
      
      // Delete rules first
      await supabase.from("promo_code_rules").delete().eq("promo_code_id", selectedPromo.id)
      
      // Then delete the promo code
      const { error } = await supabase.from("promo_codes").delete().eq("id", selectedPromo.id)

      if (error) throw error

      toast({ title: "Success", description: "Promo code deleted successfully" })
      setIsDeleteDialogOpen(false)
      setSelectedPromo(null)
      await fetchPromoCodes()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete promo code",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleToggleActive(promo: PromoCode) {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active: !promo.is_active })
        .eq("id", promo.id)

      if (error) throw error

      toast({
        title: "Success",
        description: `Promo code ${promo.is_active ? "disabled" : "enabled"}`,
      })
      await fetchPromoCodes()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update promo code",
        variant: "destructive",
      })
    }
  }

  async function handleAddRule() {
    if (!selectedPromo || !ruleFormData.event_slug) return

    setIsProcessing(true)
    try {
      const supabase = createClient()
      const eventOption = EVENT_OPTIONS.find(e => e.value === ruleFormData.event_slug)

      const { error } = await supabase.from("promo_code_rules").insert({
        promo_code_id: selectedPromo.id,
        event_slug: ruleFormData.event_slug,
        event_label: eventOption?.label || ruleFormData.event_slug,
        participant_type: ruleFormData.participant_type === "all" ? null : ruleFormData.participant_type,
        discount_type: ruleFormData.discount_type,
        discount_value: ruleFormData.discount_value,
      })

      if (error) throw error

      toast({ title: "Success", description: "Rule added successfully" })
      setRuleFormData({
        event_slug: "",
        event_label: "",
        participant_type: "all",
        discount_type: "percentage",
        discount_value: 0,
      })
      await fetchPromoCodes()
      // Update selected promo with new data
      const updatedPromo = promoCodes.find(p => p.id === selectedPromo.id)
      if (updatedPromo) setSelectedPromo(updatedPromo)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add rule",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleDeleteRule(ruleId: string) {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("promo_code_rules").delete().eq("id", ruleId)

      if (error) throw error

      toast({ title: "Success", description: "Rule deleted" })
      await fetchPromoCodes()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete rule",
        variant: "destructive",
      })
    }
  }

  function resetForm() {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 0,
      max_uses: "",
      starts_at: "",
      expires_at: "",
      is_active: true,
    })
  }

  function openEditDialog(promo: PromoCode) {
    setSelectedPromo(promo)
    setFormData({
      code: promo.code,
      description: promo.description || "",
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      max_uses: promo.max_uses?.toString() || "",
      starts_at: promo.starts_at ? promo.starts_at.split("T")[0] : "",
      expires_at: promo.expires_at ? promo.expires_at.split("T")[0] : "",
      is_active: promo.is_active,
    })
    setIsEditDialogOpen(true)
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filteredPromoCodes = promoCodes.filter(promo =>
    promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    promo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: promoCodes.length,
    active: promoCodes.filter(p => p.is_active).length,
    totalUses: promoCodes.reduce((sum, p) => sum + p.current_uses, 0),
    totalDiscount: promoCodes.reduce((sum, p) => 
      sum + (p.uses?.reduce((s, u) => s + (u.discount_amount || 0), 0) || 0), 0
    ),
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 w-full max-w-7xl mx-auto pt-24 pb-20 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Promo Codes</h1>
              <p className="text-muted-foreground">Manage discount codes and promotional offers</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchPromoCodes} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true) }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Promo
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Tag className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                    <p className="text-sm text-blue-600">Total Codes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                    <p className="text-sm text-green-600">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-700">{stats.totalUses}</p>
                    <p className="text-sm text-purple-600">Total Uses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-700">{formatCurrency(stats.totalDiscount, "IDR")}</p>
                    <p className="text-sm text-amber-600">Total Discounts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search promo codes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Promo Codes List */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredPromoCodes.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-lg">No promo codes found</h3>
                  <p className="text-muted-foreground">Create your first promo code to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Validity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPromoCodes.map((promo) => (
                        <TableRow key={promo.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                                {promo.code}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyCode(promo.code)}
                              >
                                {copiedCode === promo.code ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {promo.description || "-"}
                          </TableCell>
                          <TableCell>
                            {promo.rules && promo.rules.length > 0 ? (
                              <Badge variant="outline" className="font-normal">
                                {promo.rules.length} rule(s)
                              </Badge>
                            ) : promo.discount_type === "percentage" ? (
                              <span className="font-medium text-green-600">{promo.discount_value}% off</span>
                            ) : promo.discount_type === "fixed_amount" ? (
                              <span className="font-medium text-green-600">-{formatCurrency(promo.discount_value, "IDR")}</span>
                            ) : (
                              <span className="font-medium text-blue-600">{formatCurrency(promo.discount_value, "IDR")}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{promo.current_uses}</span>
                              <span className="text-muted-foreground">
                                / {promo.max_uses || "∞"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {promo.expires_at ? (
                              <div className="text-sm">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(promo.expires_at), "dd MMM yyyy")}
                                </div>
                                {new Date(promo.expires_at) < new Date() && (
                                  <Badge variant="destructive" className="text-xs mt-1">Expired</Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No expiry</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={promo.is_active}
                              onCheckedChange={() => handleToggleActive(promo)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSelectedPromo(promo); setIsRulesDialogOpen(true) }}
                                title="Manage Rules"
                              >
                                <Percent className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSelectedPromo(promo); setIsUsageDialogOpen(true) }}
                                title="View Usage"
                              >
                                <BarChart3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(promo)}
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSelectedPromo(promo); setIsDeleteDialogOpen(true) }}
                                title="Delete"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) { setIsCreateDialogOpen(false); setIsEditDialogOpen(false); resetForm() }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? "Edit Promo Code" : "Create Promo Code"}</DialogTitle>
            <DialogDescription>
              {isEditDialogOpen ? "Update the promo code details" : "Create a new promotional discount code"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SUMMER2026"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Discount Type</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(v) => setFormData({ ...formData, discount_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                    <SelectItem value="fixed_price">Fixed Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  {formData.discount_type === "percentage" ? "Percentage (%)" : "Amount (IDR)"}
                </Label>
                <Input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Max Uses (leave empty for unlimited)</Label>
              <Input
                type="number"
                value={formData.max_uses}
                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                placeholder="Unlimited"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); setIsEditDialogOpen(false); resetForm() }}>
              Cancel
            </Button>
            <Button onClick={isEditDialogOpen ? handleUpdatePromo : handleCreatePromo} disabled={isProcessing}>
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              {isEditDialogOpen ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Promo Code</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedPromo?.code}</strong>? This action cannot be undone and will also delete all associated rules.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePromo} disabled={isProcessing}>
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rules Management Dialog */}
      <Dialog open={isRulesDialogOpen} onOpenChange={setIsRulesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Discount Rules for {selectedPromo?.code}</DialogTitle>
            <DialogDescription>
              Add specific discount rules for different events or participant types
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Existing Rules */}
            {selectedPromo?.rules && selectedPromo.rules.length > 0 && (
              <div className="space-y-2">
                <Label>Current Rules</Label>
                <div className="space-y-2">
                  {selectedPromo.rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{rule.event_label || rule.event_slug}</p>
                        <p className="text-sm text-muted-foreground">
                          {rule.participant_type && `${rule.participant_type} only - `}
                          {rule.discount_type === "percentage" 
                            ? `${rule.discount_value}% off`
                            : rule.discount_type === "fixed_amount"
                            ? `-${formatCurrency(rule.discount_value, "IDR")}`
                            : formatCurrency(rule.discount_value, "IDR")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Rule */}
            <div className="space-y-4 pt-4 border-t">
              <Label>Add New Rule</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Event</Label>
                  <Select
                    value={ruleFormData.event_slug}
                    onValueChange={(v) => setRuleFormData({ ...ruleFormData, event_slug: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_OPTIONS.map((event) => (
                        <SelectItem key={event.value} value={event.value}>
                          {event.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Participant Type</Label>
                  <Select
                    value={ruleFormData.participant_type}
                    onValueChange={(v) => setRuleFormData({ ...ruleFormData, participant_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PARTICIPANT_OPTIONS.map((pt) => (
                        <SelectItem key={pt.value} value={pt.value}>
                          {pt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Discount Type</Label>
                  <Select
                    value={ruleFormData.discount_type}
                    onValueChange={(v) => setRuleFormData({ ...ruleFormData, discount_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                      <SelectItem value="fixed_price">Fixed Price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">
                    {ruleFormData.discount_type === "percentage" ? "Percentage (%)" : "Amount (IDR)"}
                  </Label>
                  <Input
                    type="number"
                    value={ruleFormData.discount_value}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, discount_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <Button onClick={handleAddRule} disabled={!ruleFormData.event_slug || isProcessing}>
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Rule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Usage Statistics Dialog */}
      <Dialog open={isUsageDialogOpen} onOpenChange={setIsUsageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Usage Statistics for {selectedPromo?.code}</DialogTitle>
            <DialogDescription>
              View how this promo code has been used
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{selectedPromo?.current_uses || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Uses</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{selectedPromo?.max_uses || "∞"}</p>
                  <p className="text-sm text-muted-foreground">Max Uses</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      selectedPromo?.uses?.reduce((sum, u) => sum + (u.discount_amount || 0), 0) || 0,
                      "IDR"
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Savings</p>
                </CardContent>
              </Card>
            </div>

            {selectedPromo?.uses && selectedPromo.uses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Original</TableHead>
                    <TableHead>Discount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPromo.uses.map((use) => (
                    <TableRow key={use.id}>
                      <TableCell>{format(new Date(use.created_at), "dd MMM yyyy HH:mm")}</TableCell>
                      <TableCell className="font-mono text-xs">{use.order_id.slice(0, 8)}...</TableCell>
                      <TableCell>{formatCurrency(use.original_amount, "IDR")}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        -{formatCurrency(use.discount_amount, "IDR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No usage records yet
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
