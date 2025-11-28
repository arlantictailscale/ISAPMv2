import { createClient } from "@/lib/supabase/server"

/**
 * Batch fetch users with their profiles in a single query
 * Prevents N+1 query problem
 */
export async function batchFetchUsersWithProfiles(userIds: string[]) {
  if (userIds.length === 0) return []

  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").select("*").in("id", userIds)

  if (error) {
    console.error("Error batch fetching profiles:", error)
    return []
  }

  return data || []
}

/**
 * Optimized query for admin dashboard stats
 * Uses parallel queries instead of sequential
 */
export async function getAdminDashboardStats() {
  const supabase = await createClient()

  const [usersResult, postersResult, pendingPostersResult, paymentsResult, ordersResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("abstracts").select("id", { count: "exact", head: true }),
    supabase.from("abstracts").select("id", { count: "exact", head: true }).eq("submission_status", "pending"),
    supabase.from("order_payments").select("id", { count: "exact", head: true }).eq("payment_status", "pending"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
  ])

  return {
    totalUsers: usersResult.count || 0,
    totalPosters: postersResult.count || 0,
    pendingPosters: pendingPostersResult.count || 0,
    pendingPayments: paymentsResult.count || 0,
    totalOrders: ordersResult.count || 0,
  }
}

/**
 * Optimized query for user dashboard stats
 */
export async function getUserDashboardStats(userId: string) {
  const supabase = await createClient()

  const [postersResult, ordersResult, cartResult, pendingPaymentsResult] = await Promise.all([
    supabase.from("abstracts").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("carts").select("*, cart_items(id)").eq("user_id", userId).eq("status", "active").maybeSingle(),
    supabase
      .from("orders")
      .select(`id, order_payments(payment_status)`)
      .eq("user_id", userId)
      .then(({ data }) => {
        return (
          data?.filter((order) => {
            const payment = order.order_payments?.[0]
            return !payment || payment.payment_status === "pending"
          }).length || 0
        )
      }),
  ])

  return {
    posterCount: postersResult.count || 0,
    orderCount: ordersResult.count || 0,
    activeCart: cartResult?.cart_items?.length || 0,
    pendingPayments: await pendingPaymentsResult,
  }
}
