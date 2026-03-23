import { ChatRoom } from "@/components/ChatRoom";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomPage({ params }: PageProps) {
  const { id } = await params;
  return <ChatRoom roomId={id} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return {
    title: `Room ${id.slice(0, 6)}… · Zerra`,
    description: "Private encrypted chat room — Zerra",
  };
}