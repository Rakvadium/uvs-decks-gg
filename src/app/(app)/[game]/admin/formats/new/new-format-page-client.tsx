"use client";

import { AdminPageHeader } from "@/components/admin";
import { FormatFormContent } from "@/features/admin-format/format-form-content";

export default function NewFormatPageClient() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:h-full">
      <AdminPageHeader
        title="New format"
        description="Create a play format. Keys are stable; use a short slug (e.g. standard, custom-league)."
        backHref="/admin/formats"
        backLabel="All formats"
      />
      <div className="px-1">
        <FormatFormContent mode="create" />
      </div>
    </div>
  );
}
