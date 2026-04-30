'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function TestTrustScore() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Auth states
  const [email, setEmail] = useState('test1@jamiyya.com');
  const [password, setPassword] = useState('password123');
  const [authMsg, setAuthMsg] = useState('');

  // Initialize Supabase client
  const supabase = createSupabaseBrowserClient();

  // Check session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignUp = async () => {
    setLoading(true);
    setAuthMsg('');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setAuthMsg(`Sign Up Error: ${error.message}`);
    else setAuthMsg('Sign Up Success! You are now logged in (unless email confirm is required).');
    setLoading(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    setAuthMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthMsg(`Sign In Error: ${error.message}`);
    else setAuthMsg('Sign In Success!');
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setResult(null);
  };

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

  const testCurrentScore = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trust-score');
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
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        setResult({ error: "No active session found. Please use the Auth tools above to log in." });
        setLoading(false);
        return;
      }

      const res = await fetch('/api/trust-score/history', {
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`
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
      
      {/* AUTH WIDGET */}
      <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">Auth (Create Test Accounts)</h2>
        {session ? (
          <div>
            <p className="text-green-600 font-bold mb-2">✅ Logged in as: {session.user.email}</p>
            <button onClick={handleSignOut} className="px-4 py-2 bg-red-600 text-white rounded font-bold">Sign Out</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-sm">
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="p-2 border rounded" placeholder="Email" />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="p-2 border rounded" placeholder="Password" />
            <div className="flex gap-2 mt-2">
              <button onClick={handleSignIn} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded font-bold flex-1">Sign In</button>
              <button onClick={handleSignUp} disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded font-bold flex-1">Sign Up</button>
            </div>
            {authMsg && <p className="text-sm mt-2 font-semibold text-slate-600">{authMsg}</p>}
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold mb-4">API Tests</h2>
      <div className="flex gap-4 mb-8">
        <button 
          onClick={testCalculate} 
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Initial Calculation'}
        </button>
        <button 
          onClick={testCurrentScore} 
          disabled={loading}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow disabled:opacity-50"
        >
          {loading ? 'Fetching...' : 'Check Current Score'}
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
