import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

async function getUserFamily(accessToken: string) {
  try {
    const response = await fetch('http://localhost:3001/api/families/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      cache: 'no-store'
    });
    const data = await response.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();

  if (!user || !session) {
    redirect('/login');
  }

  // Check if user has a family
  const family = await getUserFamily(session.access_token);

  if (!family) {
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FamFi Dashboard</h1>
            <p className="text-sm text-gray-500">{family.name}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Summary Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
            <p className="text-2xl font-bold text-green-600">$0.00</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Expense</h3>
            <p className="text-2xl font-bold text-red-600">$0.00</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Balance</h3>
            <p className="text-2xl font-bold text-gray-900">$0.00</p>
          </div>
        </div>

        {/* Family Info Card */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Family Settings</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Invite Code:</p>
              <p className="text-2xl font-mono font-bold text-blue-600">{family.invite_code}</p>
              <p className="text-sm text-gray-500">Share this code with family members</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex space-x-4">
            <Link
              href="/transactions/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Transaction
            </Link>
            <Link
              href="/settings"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Settings
            </Link>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
          <p className="text-gray-500">No transactions yet. Add your first transaction!</p>
        </div>
      </main>
    </div>
  );
}
