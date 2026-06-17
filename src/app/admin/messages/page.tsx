import { listMessageThreadsRich } from '@/lib/messages';
import { MessagesInbox } from '@/components/admin/MessagesInbox';

export default async function AdminMessagesPage() {
  const threads = await listMessageThreadsRich();
  return <MessagesInbox threads={threads} activeId={null} />;
}
