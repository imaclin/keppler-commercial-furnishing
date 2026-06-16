import { getProfile } from '@/lib/auth';
import { ProfileForm } from '@/components/account/ProfileForm';

export default async function ProfilePage() {
  const profile = await getProfile();
  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Profile</h1>
      <div className="mt-8">
        {profile && <ProfileForm name={profile.name} email={profile.email} />}
      </div>
    </main>
  );
}
