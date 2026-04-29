'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function TestChat() {
  const [jamId, setJamId] = useState('1e61e679-8859-4329-a8cc-7c4a9520446f');
  const [prompt, setPrompt] = useState('Hello! When is my turn to receive the payout, and how much will I get?');
  const [response, setResponse] = useState('');
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
  };

  const testChat = async () => {
    setLoading(true);
    setResponse('');
    
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        setResponse("Error: No active session found. Please use the Auth tools above to log in.");
        setLoading(false);
        return;
      }

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`
        },
        body: JSON.stringify({
          jam3iyyaId: jamId,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setResponse(`Error HTTP ${res.status}: ${errorData.error || res.statusText}`);
        setLoading(false);
        return;
      }

      // Read the stream chunk by chunk
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          setResponse(prev => prev + text);
        }
      }
    } catch (err: any) {
      setResponse(`Fetch Error: ${err.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="p-10 max-w-3xl mx-auto bg-slate-50 text-slate-900 min-h-screen font-sans" dir="ltr">
      <h1 className="text-3xl font-bold mb-6">🤖 Test: AI Chat API</h1>
      
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

      <div className="flex flex-col gap-5 mb-8 bg-white p-6 border border-slate-200 rounded-lg shadow-sm">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Jam3iyya ID (Context)</label>
          <input 
            type="text" 
            value={jamId} 
            onChange={e => setJamId(e.target.value)} 
            className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none"
            placeholder="Paste a valid jam3iyya UUID here..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Message to AI</label>
          <textarea 
            value={prompt} 
            onChange={e => setPrompt(e.target.value)} 
            className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none"
            rows={3}
            placeholder="Ask a question..."
          />
        </div>
        
        <button 
          onClick={testChat} 
          disabled={loading}
          className="mt-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow disabled:opacity-50 transition-colors"
        >
          {loading ? 'Thinking and Streaming...' : 'Send Message'}
        </button>
      </div>

      <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-lg min-h-[200px]">
        <h2 className="text-lg font-bold mb-4 text-slate-400">Streamed Response:</h2>
        <div className="text-base text-slate-800 whitespace-pre-wrap leading-relaxed">
          {response || <span className="text-slate-400 italic">AI Response will stream here chunk by chunk...</span>}
        </div>
      </div>
    </div>
  );
}
