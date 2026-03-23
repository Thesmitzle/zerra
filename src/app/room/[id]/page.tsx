import { ChatRoom } from "@/components/ChatRoom";

interface PageProps {
  params: { id: string };
}

export default function RoomPage({ params }: PageProps) {
  return <ChatRoom roomId={params.id} />;
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: `Room ${params.id.slice(0, 6)}… · Zerra`,
    description: "Private encrypted chat room — Zerra",
  };
}
