import { redirect } from "next/navigation";
import { AdminImportLegacyGate } from "./import-legacy-gate";

type PageProps = {
  searchParams: Promise<{ legacy?: string }>;
};

export default async function AdminImportPage({ searchParams }: PageProps) {
  const p = await searchParams;
  if (p.legacy === "1") {
    return <AdminImportLegacyGate />;
  }
  redirect("/admin/sets?deprecatedGlobalImport=1");
}
