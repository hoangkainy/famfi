'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<'choice' | 'create' | 'join'>('choice');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateFamily(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const response = await fetch('http://localhost:3001/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ name: familyName })
      });

      const data = await response.json();
      if (!data.success) { setError(data.error?.message || 'Failed'); setLoading(false); return; }

      router.push('/dashboard');
      router.refresh();
    } catch { setError('Failed to create family'); setLoading(false); }
  }

  async function handleJoinFamily(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const response = await fetch('http://localhost:3001/api/families/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ inviteCode })
      });

      const data = await response.json();
      if (!data.success) { setError(data.error?.message || 'Failed'); setLoading(false); return; }

      router.push('/dashboard');
      router.refresh();
    } catch { setError('Failed to join family'); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to FamFi!</CardTitle>
          <CardDescription>Let&apos;s set up your family</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === 'choice' && (
            <div className="space-y-4">
              <Button onClick={() => setStep('create')} variant="outline" className="w-full h-20 flex-col gap-1">
                <span className="text-lg font-semibold">Create a new family</span>
                <span className="text-sm text-muted-foreground">Start fresh and invite members</span>
              </Button>

              <Button onClick={() => setStep('join')} variant="outline" className="w-full h-20 flex-col gap-1">
                <span className="text-lg font-semibold">Join existing family</span>
                <span className="text-sm text-muted-foreground">Use an invite code</span>
              </Button>
            </div>
          )}

          {step === 'create' && (
            <form onSubmit={handleCreateFamily} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Family name</label>
                <Input
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="e.g., The Smiths"
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep('choice')} className="flex-1">
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          )}

          {step === 'join' && (
            <form onSubmit={handleJoinFamily} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Invite code</label>
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC123XY"
                  required
                  maxLength={8}
                  className="uppercase text-center text-lg tracking-widest"
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep('choice')} className="flex-1">
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Joining...' : 'Join'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
