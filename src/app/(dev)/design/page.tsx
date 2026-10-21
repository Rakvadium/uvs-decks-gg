import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { isDesignCatalogEnabled } from "@/lib/design-catalog-gate";
import { DesignCatalog } from "@/components/design-catalog/content";
import { overrideBootScript, parseCatalogOverride, parseFocus } from "@/components/design-catalog/appearance/params";
import { CHAPTER_IDS } from "@/components/design-catalog/registry";
import { readCatalogSource } from "@/components/design-catalog/source/read";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

type DesignPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DesignPage({ searchParams }: DesignPageProps) {
  // Gate per request, not at build time, so one build can't leak the catalog into production.
  await connection();
  if (!isDesignCatalogEnabled()) notFound();

  const params = await searchParams;
  const override = parseCatalogOverride(params);
  const boot = overrideBootScript(override);

  return (
    <>
      {boot ? <script dangerouslySetInnerHTML={{ __html: boot }} /> : null}
      <DesignCatalog
        source={readCatalogSource()}
        initialOverride={override}
        initialFocus={parseFocus(params, CHAPTER_IDS)}
      />
    </>
  );
}
