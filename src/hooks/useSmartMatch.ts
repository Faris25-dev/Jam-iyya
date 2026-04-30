'use client';

import { useEffect, useState, useCallback } from 'react';

export interface SmartMatchCircle {
  id: string;
  name: string;
  description: string | null;
  type: string;
  monthly_amount: number;
  total_members: number;
  duration_months: number;
  min_trust_score: number;
  status: string;
  current_members_count: number;
  start_date: string;
  created_at: string;
  insurance_percentage: number;
  turn_allocation_method: string;
  matchPercentage: number;
  matchReasons: { ar: string; en: string }[];
  warnings: { ar: string; en: string }[];
}

export interface SmartMatchUserContext {
  trustScore: number;
  tier: string;
  walletBalance: number;
}

export interface UseSmartMatchReturn {
  matches: SmartMatchCircle[];
  userContext: SmartMatchUserContext | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSmartMatch(): UseSmartMatchReturn {
  const [matches, setMatches] = useState<SmartMatchCircle[]>([]);
  const [userContext, setUserContext] = useState<SmartMatchUserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/jam3iyyas/smart-match');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setMatches(data.matches ?? []);
      setUserContext(data.userContext ?? null);
    } catch (err: any) {
      setError(err.message || 'Failed to load smart match results');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return { matches, userContext, loading, error, refetch: fetchMatches };
}
