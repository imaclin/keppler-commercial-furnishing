'use client';

import { useState } from 'react';
import { updateProfileNameAction } from '@/app/actions/account';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <form action={async (fd) => { await updateProfileNameAction(fd); setSaved(true); }} className="max-w-md space-y-4">
      <div className="space-y-2"><Label>Email</Label><Input value={email} disabled /></div>
      <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" defaultValue={name} required /></div>
      {saved && <p className="text-sm text-[var(--walnut)]">Saved.</p>}
      <Button type="submit" onClick={() => setSaved(false)}>Save</Button>
    </form>
  );
}
