import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Navigation from "@/components/navigation"
import { AdminNav } from "@/components/admin-nav"
import Footer from "@/components/footer"
import { EventsDashboard } from "./events-dashboard"

export const metadata = {
  title: "Events Dashboard | Admin",
  description: "View and manage all symposium events and workshops",
}

export default async function AdminEventsPage() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/auth/login")
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      redirect("/")
    }
  } catch (error) {
    console.error("Auth error:", error)
    redirect("/auth/login")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <div className="flex flex-1">
        <AdminNav />
        <main className="flex-1 lg:pl-64">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <EventsDashboard />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
