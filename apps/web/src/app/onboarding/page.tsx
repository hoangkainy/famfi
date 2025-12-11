'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:3001/api/families', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ name: familyName })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Failed to create family');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('Failed to create family');
      setLoading(false);
    }
  }

  async function handleJoinFamily(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:3001/api/families/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ inviteCode })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Failed to join family');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('Failed to join family');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to FamFi!</h1>
          <p className="mt-2 text-gray-600">
            Let&apos;s get you set up with your family
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {step === 'choice' && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('create')}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
            >
              <h3 className="text-lg font-semibold text-gray-900">Create a new family</h3>
              <p className="text-gray-500 mt-1">Start fresh and invite your family members</p>
            </button>

            <button
              onClick={() => setStep('join')}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
            >
              <h3 className="text-lg font-semibold text-gray-900">Join an existing family</h3>
              <p className="text-gray-500 mt-1">Use an invite code from a family member</p>
            </button>
          </div>
        )}

        {step === 'create' && (
          <form onSubmit={handleCreateFamily} className="space-y-6">
            <div>
              <label htmlFor="familyName" className="block text-sm font-medium text-gray-700">
                Family name
              </label>
              <input
                id="familyName"
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g., The Smiths"
                required
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep('choice')}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Family'}
              </button>
            </div>
          </form>
        )}

        {step === 'join' && (
          <form onSubmit={handleJoinFamily} className="space-y-6">
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700">
                Invite code
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g., ABC123XY"
                required
                maxLength={8}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 uppercase"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep('choice')}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join Family'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
