"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShieldCheck, User, UserCog, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface UserProfile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  institution: string | null
  position: string | null
  role: string
  created_at: string
  registrationCount: number
  posterCount: number
}

export default function AdminUsersPage() {
  const router = useRouter()
  const supabase = createClient()

  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [newRole, setNewRole] = useState<"admin" | "user">("user")

  useEffect(() => {
    checkAdminAndFetchUsers()
  }, [])

  const checkAdminAndFetchUsers = async () => {
    try {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (!profile || profile.role !== "admin") {
        toast.error("Unauthorized access")
        router.push("/")
        return
      }

      await fetchUsers()
    } catch (err) {
      console.error("Error checking admin status:", err)
      toast.error("Failed to load admin panel")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast.error("Session expired. Please login again.")
        router.push("/auth/login")
        return
      }

      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.users)
      toast.success(`Loaded ${data.users.length} users successfully`)
    } catch (err) {
      console.error("Error fetching users:", err)
      toast.error("Failed to load users")
    }
  }

  const handleRoleChange = (user: UserProfile, role: "admin" | "user") => {
    setSelectedUser(user)
    setNewRole(role)
    setShowRoleDialog(true)
  }

  const confirmRoleChange = async () => {
    if (!selectedUser) return

    setIsProcessing(true)

    try {
      console.log("[v0] Starting role change for user:", selectedUser.id, "to", newRole)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast.error("Session expired. Please login again.")
        router.push("/auth/login")
        return
      }

      console.log("[v0] Making API request to update-role")

      const response = await fetch("/api/admin/update-role", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          newRole: newRole,
        }),
      })

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        let errorMessage = "Failed to update role"
        try {
          const errorData = await response.json()
          console.error("[v0] Error data:", errorData)
          errorMessage = errorData.details || errorData.error || errorMessage
        } catch (e) {
          console.error("[v0] Could not parse error response:", e)
          errorMessage = `Server error (${response.status}): ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("[v0] Success result:", result)
      toast.success(result.message || `User role updated to ${newRole} successfully`)
      setShowRoleDialog(false)
      setSelectedUser(null)
      await fetchUsers()
    } catch (err) {
      console.error("[v0] Error updating user role:", err)
      toast.error(err instanceof Error ? err.message : "Failed to update user role")
    } finally {
      setIsProcessing(false)
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground">
        <User className="w-3 h-3 mr-1" />
        User
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading admin panel...</p>
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
        <section className="py-12 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl sm:text-5xl font-bold mb-2">User Management</h1>
                <p className="text-lg text-muted-foreground">View and manage user roles</p>
              </div>
              <Button onClick={fetchUsers} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Users ({users.length})</CardTitle>
                <CardDescription>Manage user roles and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Institution</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-center">Registrations</TableHead>
                        <TableHead className="text-center">Posters</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : user.first_name || user.last_name || "-"}
                          </TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell className="text-sm">{user.institution || "-"}</TableCell>
                          <TableCell className="text-sm">{user.position || "-"}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell className="text-center">{user.registrationCount}</TableCell>
                          <TableCell className="text-center">{user.posterCount}</TableCell>
                          <TableCell className="text-center">
                            {user.role === "admin" ? (
                              <Button size="sm" variant="outline" onClick={() => handleRoleChange(user, "user")}>
                                <User className="w-3 h-3 mr-1" />
                                Demote
                              </Button>
                            ) : (
                              <Button size="sm" variant="default" onClick={() => handleRoleChange(user, "admin")}>
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                Promote
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Role Change</DialogTitle>
            <DialogDescription>Are you sure you want to change this user's role?</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">User:</span> {selectedUser.first_name} {selectedUser.last_name} (
                  {selectedUser.email})
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Current Role:</span> {getRoleBadge(selectedUser.role)}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">New Role:</span> {getRoleBadge(newRole)}
                </p>
              </div>
              {newRole === "admin" && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Warning:</strong> Admins have full access to all payment validations, user management, and
                    poster submissions.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={confirmRoleChange} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <UserCog className="w-4 h-4 mr-2" />
                  Confirm Change
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
