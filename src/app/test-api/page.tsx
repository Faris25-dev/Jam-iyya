'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function TestApiPage() {
  const [output, setOutput] = useState<string>('Ready to test...');
  const [session, setSession] = useState<any>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [txCount, setTxCount] = useState<number>(0);
  const [paymentJam3iyyaId, setPaymentJam3iyyaId] = useState<string>('');
  const [paymentUserId, setPaymentUserId] = useState<string>('');
  const [paymentMonthNumber, setPaymentMonthNumber] = useState<number>(1);

  const supabase = createSupabaseBrowserClient();

  const handleLogin = async () => {
    setOutput('Logging in...');
    const { data, error } = await supabase.auth.signUp({
      email: `testfrontend${Date.now()}@jamiyya.com`,
      password: 'TestPassword123!',
    });

    if (error) {
      setOutput(`Login Error: ${error.message}`);
      return;
    }

    setSession(data.session);
    
    await supabase.from('profiles').upsert({
      id: data.user!.id,
      full_name: 'Frontend Tester',
      trust_score: 90,
      tier: 'silver',
      verification_status: 'verified',
      wallet_balance: 5000, // Starts at 5000 for wallet testing
      preferred_language: 'en'
    });

    setBalance(5000);
    setOutput(`Logged in successfully as ${data.user?.email}!\nCookies are now set.`);
  };

  const handleTestPost = async () => {
    setOutput('Testing POST /api/jam3iyyas...');
    try {
      const res = await fetch('/api/jam3iyyas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Frontend Test Circle',
          description: 'Testing the API from the browser',
          type: 'public',
          monthly_amount: 50,
          total_members: 3,
          duration_months: 3,
          start_date: '2026-06-01',
          min_trust_score: 50,
          turn_allocation_method: 'first_come'
        })
      });
      const data = await res.json();
      if (res.ok) setLastCreatedId(data.id);
      setOutput(`POST Status: ${res.status}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (e: any) {
      setOutput(`POST Error: ${e.message}`);
    }
  };

  const handleTestGetList = async () => {
    setOutput('Testing GET /api/jam3iyyas?status=recruiting&limit=5...');
    try {
      const res = await fetch('/api/jam3iyyas?status=recruiting&limit=5');
      const data = await res.json();
      setOutput(`GET List Status: ${res.status}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (e: any) {
      setOutput(`GET List Error: ${e.message}`);
    }
  };

  const handleTestGetSingle = async () => {
    if (!lastCreatedId) return;
    setOutput(`Testing GET /api/jam3iyyas/${lastCreatedId}...`);
    try {
      const res = await fetch(`/api/jam3iyyas/${lastCreatedId}`);
      const data = await res.json();
      setOutput(`GET Single Status: ${res.status}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (e: any) {
      setOutput(`GET Single Error: ${e.message}`);
    }
  };

  const handleTestPatch = async () => {
    if (!lastCreatedId) return;
    setOutput(`Testing PATCH /api/jam3iyyas/${lastCreatedId}...`);
    try {
      const res = await fetch(`/api/jam3iyyas/${lastCreatedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Circle Name',
        })
      });
      const data = await res.json();
      setOutput(`PATCH Status: ${res.status}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (e: any) {
      setOutput(`PATCH Error: ${e.message}`);
    }
  };

  const handleTestJoin = async () => {
    if (!lastCreatedId) return;
    setOutput(`Testing POST /api/jam3iyyas/${lastCreatedId}/join...`);
    try {
      const res = await fetch(`/api/jam3iyyas/${lastCreatedId}/join`, {
        method: 'POST',
      });
      const data = await res.json();
      setOutput(`JOIN Status: ${res.status}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (e: any) {
      setOutput(`JOIN Error: ${e.message}`);
    }
  };

  const handleTestLeave = async () => {
    if (!lastCreatedId) return;
    setOutput(`Testing POST /api/jam3iyyas/${lastCreatedId}/leave...`);
    try {
      const res = await fetch(`/api/jam3iyyas/${lastCreatedId}/leave`, {
        method: 'POST',
      });
      const data = await res.json();
      setOutput(`LEAVE Status: ${res.status}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (e: any) {
      setOutput(`LEAVE Error: ${e.message}`);
    }
  };

  // -----------------------------------------------------
  // WALLET HANDLERS
  // -----------------------------------------------------

  const handleWalletGet = async () => {
    setOutput('Testing GET /api/wallet...');
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        setTxCount(prev => prev + 1);
      }
      setOutput(`WALLET GET Status: ${res.status}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (e: any) {
      setOutput(`WALLET GET Error: ${e.message}`);
    }
  };

  const handleWalletDeposit = async () => {
    setOutput('Testing POST /api/wallet (Deposit 1000)...');
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'deposit', amount: 1000 })
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        setTxCount(prev => prev + 1);
      }
      setOutput(`WALLET DEPOSIT Status: ${res.status}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (e: any) {
      setOutput(`WALLET DEPOSIT Error: ${e.message}`);
    }
  };

  const handleWalletWithdraw = async () => {
    setOutput('Testing POST /api/wallet (Withdraw 500)...');
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'withdraw', amount: 500 })
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        setTxCount(prev => prev + 1);
      }
      setOutput(`WALLET WITHDRAW Status: ${res.status}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (e: any) {
      setOutput(`WALLET WITHDRAW Error: ${e.message}`);
    }
  };

  const handleWalletTransactions = async () => {
    setOutput('Testing GET /api/wallet/transactions...');
    try {
      const res = await fetch('/api/wallet/transactions');
      const data = await res.json();
      setOutput(`WALLET TRANSACTIONS Status: ${res.status}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (e: any) {
      setOutput(`WALLET TRANSACTIONS Error: ${e.message}`);
    }
  };

  const runPaymentTest = async (action: 'cycle' | 'schedule' | 'manual' | 'default') => {
    const jam3iyyaId = paymentJam3iyyaId || lastCreatedId;

    if (!jam3iyyaId) {
      setOutput('Set a jam3iyya ID first or create a circle above.');
      return;
    }

    if ((action === 'manual' || action === 'default') && !paymentUserId) {
      setOutput('Set a user ID for manual payment or default testing.');
      return;
    }

    setOutput(`Testing payment action: ${action}...`);

    try {
      const res = await fetch('/api/test/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          jam3iyyaId,
          userId: paymentUserId || undefined,
          monthNumber: paymentMonthNumber,
        }),
      });

      const data = await res.json();
      setOutput(`${action.toUpperCase()} Status: ${res.status}\n\n${JSON.stringify(data, null, 2)}`);
    } catch (e: any) {
      setOutput(`${action.toUpperCase()} Error: ${e.message}`);
    }
  };

  const handleWalletReset = async () => {
    if (!session?.user) return;
    setOutput('Resetting Wallet Balance to 5000 directly...');
    const { error } = await supabase
      .from('profiles')
      .update({ wallet_balance: 5000 })
      .eq('id', session.user.id);
      
    if (!error) {
      setBalance(5000);
      setTxCount(prev => prev + 1);
      setOutput('Wallet reset to 5000 successfully (Dev Only).');
    } else {
      setOutput(`Reset Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>API Integration Test</h1>
      
      {session && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: '#334155' }}>Wallet Balance: <span style={{ color: '#10b981' }}>{balance !== null ? balance.toFixed(2) : '...'} JOD</span></h2>
            <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Transactions Logged: {txCount}</p>
          </div>
          <button onClick={handleWalletReset} style={{ padding: '8px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>
            Dev Reset to 5000
          </button>
        </div>
      )}

      <p>Test the endpoints by clicking the buttons in order.</p>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={handleLogin} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          1. Login
        </button>
        <button onClick={handleTestPost} disabled={!session} style={{ padding: '10px 20px', background: session ? '#10b981' : '#ccc', color: 'white', border: 'none', borderRadius: '5px', cursor: session ? 'pointer' : 'not-allowed' }}>
          2. Create Jam3iyya
        </button>
        <button onClick={handleTestGetList} disabled={!session} style={{ padding: '10px 20px', background: session ? '#8b5cf6' : '#ccc', color: 'white', border: 'none', borderRadius: '5px', cursor: session ? 'pointer' : 'not-allowed' }}>
          3. List Jam3iyyas
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={handleTestGetSingle} disabled={!lastCreatedId} style={{ padding: '10px 20px', background: lastCreatedId ? '#f59e0b' : '#ccc', color: 'white', border: 'none', borderRadius: '5px', cursor: lastCreatedId ? 'pointer' : 'not-allowed' }}>
          4. Get Single Circle
        </button>
        <button onClick={handleTestPatch} disabled={!lastCreatedId} style={{ padding: '10px 20px', background: lastCreatedId ? '#ec4899' : '#ccc', color: 'white', border: 'none', borderRadius: '5px', cursor: lastCreatedId ? 'pointer' : 'not-allowed' }}>
          5. Update Name (PATCH)
        </button>
        <button onClick={handleTestJoin} disabled={!lastCreatedId} style={{ padding: '10px 20px', background: lastCreatedId ? '#ef4444' : '#ccc', color: 'white', border: 'none', borderRadius: '5px', cursor: lastCreatedId ? 'pointer' : 'not-allowed' }}>
          6. Join Circle
        </button>
        <button onClick={handleTestLeave} disabled={!lastCreatedId} style={{ padding: '10px 20px', background: lastCreatedId ? '#ef4444' : '#ccc', color: 'white', border: 'none', borderRadius: '5px', cursor: lastCreatedId ? 'pointer' : 'not-allowed' }}>
          7. Leave Circle
        </button>
      </div>

      <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>Payment Engine Tests</h3>
      <div style={{ display: 'grid', gap: '12px', marginBottom: '16px', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gap: '8px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Jam3iyya ID</label>
          <input
            value={paymentJam3iyyaId}
            onChange={(event) => setPaymentJam3iyyaId(event.target.value)}
            placeholder={lastCreatedId ?? 'Paste the circle UUID here'}
            style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
          />
        </div>
        <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: '1fr 1fr 1fr' }}>
          <input
            value={paymentUserId}
            onChange={(event) => setPaymentUserId(event.target.value)}
            placeholder="User ID for manual/default tests"
            style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
          />
          <input
            type="number"
            min={1}
            value={paymentMonthNumber}
            onChange={(event) => setPaymentMonthNumber(Number(event.target.value))}
            placeholder="Month number"
            style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', color: '#64748b', fontSize: '0.85rem' }}>
            Uses the test route at /api/test/payments
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => runPaymentTest('schedule')} style={{ padding: '10px 20px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Load Schedule
          </button>
          <button onClick={() => runPaymentTest('cycle')} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Run Monthly Cycle
          </button>
          <button onClick={() => runPaymentTest('manual')} style={{ padding: '10px 20px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Manual Late Payment
          </button>
          <button onClick={() => runPaymentTest('default')} style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Mark Default
          </button>
        </div>
      </div>

      <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>Wallet Operations</h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={handleWalletGet} disabled={!session} style={{ padding: '10px 20px', background: session ? '#0ea5e9' : '#ccc', color: 'white', border: 'none', borderRadius: '5px', cursor: session ? 'pointer' : 'not-allowed' }}>
          Get Wallet Stats
        </button>
        <button onClick={handleWalletDeposit} disabled={!session} style={{ padding: '10px 20px', background: session ? '#10b981' : '#ccc', color: 'white', border: 'none', borderRadius: '5px', cursor: session ? 'pointer' : 'not-allowed' }}>
          Deposit 1000 JOD
        </button>
        <button onClick={handleWalletWithdraw} disabled={!session} style={{ padding: '10px 20px', background: session ? '#f59e0b' : '#ccc', color: 'white', border: 'none', borderRadius: '5px', cursor: session ? 'pointer' : 'not-allowed' }}>
          Withdraw 500 JOD
        </button>
        <button onClick={handleWalletTransactions} disabled={!session} style={{ padding: '10px 20px', background: session ? '#6366f1' : '#ccc', color: 'white', border: 'none', borderRadius: '5px', cursor: session ? 'pointer' : 'not-allowed' }}>
          History (Transactions)
        </button>
      </div>

      <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '20px', borderRadius: '8px', minHeight: '300px', overflowX: 'auto' }}>
        {output}
      </pre>
    </div>
  );
}
