import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    if (session.user.role === "ADMIN" || session.user.role === "SUPERVISOR") {
      redirect("/admin")
    } else {
      redirect("/dashboard")
    }
  } else {
    redirect("/login")
  }
}
