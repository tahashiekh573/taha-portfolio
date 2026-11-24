import { AdminApp } from "@/components/admin/admin-app";

/** The dashboard is client-rendered; every read and write goes through authenticated /api/admin routes. */
export default function AdminPage() {
  return <AdminApp />;
}
