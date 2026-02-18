import { requireRole } from "@/lib/rbac";

export default async function PrincipalPage() {
  await requireRole(["principal", "admin"]); // директор или админ

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Панель директора</h1>
      <p>Здесь будет управление школой.</p>
    </div>
  );
}
