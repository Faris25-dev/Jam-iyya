'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function TestTrustScore() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Initialize Supabase client to get the active session token
  const supabase = createSupabaseBrowserClient();

  const testCalculate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trust-score/calculate', {
        method: 'POST',
        body: JSON.stringify({
          hasUploadedId: true,
          hasUploadedSelfie: true,
          phoneAgeMonths: 24,
          hasLinkedBank: false,
          hasIncomeDoc: true
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const testHistory = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setResult({ error: "No active session found. Please log in on the main site first." });
        setLoading(false);
        return;
      }

      const res = await fetch('/api/trust-score/history', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  return (
    <div className="p-10 max-w-3xl mx-auto bg-slate-50 text-slate-900 min-h-screen font-sans" dir="ltr">
      <h1 className="text-3xl font-bold mb-6">🧪 Test: Trust Score API</h1>
      
      <p className="mb-6 text-slate-600">
        This is a standalone page purely for testing the Trust Score backend logic.
      </p>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={testCalculate} 
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Initial Calculation'}
        </button>
        <button 
          onClick={testHistory} 
          disabled={loading}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow disabled:opacity-50"
        >
          {loading ? 'Fetching...' : 'Test Fetch History'}
        </button>
      </div>

      <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-lg overflow-auto max-h-[500px]">
        <h2 className="text-lg font-bold mb-2 text-slate-400">Response Output:</h2>
        {result ? (
          <pre className="text-sm text-slate-800 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        ) : (
          <p className="text-slate-400 italic">Click a button above to see the API response.</p>
        )}
      </div>
    </div>
  );
}
