"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  trust_score: number;
  wallet_balance: number;
  verification_status: string;
  tier: string;
  preferred_language: string;
}

// Singleton client to avoid re-creating on every render
let _client: ReturnType<typeof createClient> | null = null;
function getClient() {
  if (!_client) _client = createClient();
  return _client;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const supabase = getClient();

    async function fetchProfile(userId: string) {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, phone, trust_score, wallet_balance, verification_status, tier, preferred_language"
        )
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (data && mountedRef.current) {
        setProfile(data as Profile);
      }

      if (mountedRef.current) setLoading(false);
    }

    async function init() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        if (mountedRef.current) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      if (session?.user) {
        if (mountedRef.current) setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        if (mountedRef.current) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        if (mountedRef.current) setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        if (mountedRef.current) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []); // stable empty deps — singleton client

  const signOut = async () => {
    const supabase = getClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return { user, profile, loading, signOut };
}

export default useUser;
