import { VersionHistoryView } from "@/views/admin/widgets-layout/version-history-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <VersionHistoryView layoutId={id} />;
}
