"use client";

import { useState, useEffect } from "react";
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

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

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
      } else if (data && mounted) {
        setProfile(data as Profile);
      }
      
      if (mounted) setLoading(false);
    }

    async function getSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      if (session?.user) {
        if (mounted) setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    }

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (mounted) {
          setUser(session.user);
          // Set loading to true while fetching the profile on state change
          setLoading(true);
        }
        await fetchProfile(session.user.id);
      } else {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return { user, profile, loading, signOut };
}

export default useUser;
