import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "MANAGER" || session.user.role === "ADMIN") {
    redirect("/manager/dashboard");
  } else {
    redirect("/app/dashboard");
  }
}
