import { getProfile } from '@/lib/auth';
import { listMessages } from '@/lib/messages';
import { MessageThread } from '@/components/account/MessageThread';

export default async function MessagesPage() {
  const profile = await getProfile();
  const messages = profile ? await listMessages(profile.id) : [];
  return (
    <main className="p-10">
      <h1 className="serif text-4xl text-[var(--ink)]">Messages</h1>
      <p className="mt-2 mb-8 text-sm text-[var(--stone)]">Conversations with our team about your pieces.</p>
      <MessageThread messages={messages} />
    </main>
  );
}
