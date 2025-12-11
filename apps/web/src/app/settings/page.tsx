'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Family {
  id: string;
  name: string;
  invite_code: string;
}

interface User {
  email: string;
  full_name: string;
}

interface Member {
  id: string;
  role: string;
  user: { email: string; full_name: string };
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [family, setFamily] = useState<Family | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  async function fetchData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      setUser({
        email: session.user.email || '',
        full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || ''
      });

      const headers = { 'Authorization': `Bearer ${session.access_token}` };

      const familyRes = await fetch('http://localhost:3001/api/families/me', { headers });
      const familyData = await familyRes.json();
      if (familyData.data) {
        setFamily(familyData.data);

        const membersRes = await fetch(`http://localhost:3001/api/families/${familyData.data.id}/members`, { headers });
        const membersData = await membersRes.json();
        if (membersData.success) setMembers(membersData.data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, []);

  function copyInviteCode() {
    navigator.clipboard.writeText(family?.invite_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold">Settings</h1>
          <Link href="/dashboard" className="text-blue-600 text-sm">← Dashboard</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Profile */}
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm">Profile</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                {user?.full_name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-medium">{user?.full_name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Family */}
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm">Family</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Family Name</p>
              <p className="font-medium">{family?.name}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Invite Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-2 bg-slate-100 rounded-lg font-mono text-lg text-center">{family?.invite_code}</code>
                <Button variant="outline" onClick={copyInviteCode}>
                  {copied ? '✓ Copied' : 'Copy'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Share this code to invite family members</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Members ({members.length})</p>
              <div className="space-y-2">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm">
                        {m.user.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span className="text-sm">{m.user.full_name || m.user.email}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'}`}>
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <Link href="/categories" className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-xl">📁</span>
                <span className="font-medium">Categories</span>
              </div>
              <span className="text-muted-foreground">→</span>
            </Link>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button variant="outline" onClick={handleLogout} className="w-full text-red-600 border-red-200 hover:bg-red-50">
          Logout
        </Button>
      </main>
    </div>
  );
}
