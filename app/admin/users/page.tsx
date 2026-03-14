"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShieldCheck, User, UserCog, RefreshCw, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { updateUserRole } from "@/app/actions/update-user-role"
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
  full_name: string | null
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
  
  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all")

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

      const result = await updateUserRole(selectedUser.id, newRole)

      console.log("[v0] Server action result:", result)

      if (!result.success) {
        throw new Error(result.error || "Failed to update role")
      }

      toast.success(`User role updated to ${newRole} successfully`)
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

  // Filter and paginate users
  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      (user.full_name?.toLowerCase().includes(searchLower) ?? false) ||
      (user.first_name?.toLowerCase().includes(searchLower) ?? false) ||
      (user.last_name?.toLowerCase().includes(searchLower) ?? false) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.institution?.toLowerCase().includes(searchLower) ?? false)
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  // Reset to page 1 when search or filter changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleRoleFilterChange = (value: "all" | "admin" | "user") => {
    setRoleFilter(value)
    setCurrentPage(1)
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
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>All Users ({users.length})</CardTitle>
                    <CardDescription>
                      {filteredUsers.length !== users.length 
                        ? `Showing ${filteredUsers.length} of ${users.length} users`
                        : "Manage user roles and permissions"}
                    </CardDescription>
                  </div>
                </div>
                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or institution..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={(v) => handleRoleFilterChange(v as "all" | "admin" | "user")}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-full sm:w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[200px]">Name</TableHead>
                      <TableHead className="w-[220px]">Email</TableHead>
                      <TableHead className="hidden lg:table-cell">Institution</TableHead>
                      <TableHead className="w-[80px] text-center">Role</TableHead>
                      <TableHead className="w-[50px] text-center hidden sm:table-cell" title="Registrations">Reg</TableHead>
                      <TableHead className="w-[50px] text-center hidden sm:table-cell" title="Posters">Post</TableHead>
                      <TableHead className="w-[90px] text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          {searchQuery || roleFilter !== "all" ? "No users match your search criteria" : "No users found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((user) => (
                        <TableRow key={user.id} className="text-sm">
                          <TableCell className="py-2">
                            <div className="font-medium truncate max-w-[180px]" title={user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "-"}>
                              {user.full_name
                                ? user.full_name
                                : user.first_name && user.last_name
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.first_name || user.last_name || "-"}
                            </div>
                            {/* Show institution on mobile below name */}
                            <div className="lg:hidden text-xs text-muted-foreground truncate max-w-[180px]" title={user.institution || ""}>
                              {user.institution || ""}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="truncate block max-w-[200px]" title={user.email}>{user.email}</span>
                          </TableCell>
                          <TableCell className="py-2 hidden lg:table-cell">
                            <span className="truncate block max-w-[250px]" title={user.institution || "-"}>{user.institution || "-"}</span>
                          </TableCell>
                          <TableCell className="py-2 text-center">{getRoleBadge(user.role)}</TableCell>
                          <TableCell className="py-2 text-center hidden sm:table-cell">{user.registrationCount}</TableCell>
                          <TableCell className="py-2 text-center hidden sm:table-cell">{user.posterCount}</TableCell>
                          <TableCell className="py-2 text-center">
                            {user.role === "admin" ? (
                              <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => handleRoleChange(user, "user")}>
                                Demote
                              </Button>
                            ) : (
                              <Button size="sm" variant="default" className="h-7 text-xs px-2" onClick={() => handleRoleChange(user, "admin")}>
                                Promote
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="px-3 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
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
