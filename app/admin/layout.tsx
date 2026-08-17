import type { Route } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in" as Route);
  if (!(await isAdmin())) redirect("/" as Route);

  return <>{children}</>;
};

export default AdminLayout;
