import { PageHeading } from "@/components/ui/typography-headings";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <PageHeading size="hero">404</PageHeading>
      <p className="mt-4 text-muted-foreground">Page not found</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Go home
      </Link>
    </div>
  );
}
