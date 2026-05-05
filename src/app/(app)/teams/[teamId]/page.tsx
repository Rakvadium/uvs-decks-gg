import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ teamId: string }>;
};

export default async function TeamHubRootPage({ params }: Props) {
  const { teamId } = await params;
  redirect(`/teams/${teamId}/announcements`);
}
