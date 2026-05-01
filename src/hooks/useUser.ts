"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  profile_image_url: string | null;
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

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, label: string) {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
  });

  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timeoutId));
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
      try {
        const { data, error } = await withTimeout(
          supabase
            .from("profiles")
            .select(
              "id, full_name, phone, profile_image_url, trust_score, wallet_balance, verification_status, tier, preferred_language"
            )
            .eq("id", userId)
            .single(),
          6000,
          "Profile request"
        );

        if (error) {
          console.error("Error fetching profile:", error);
        } else if (data && mountedRef.current) {
          setProfile(data as Profile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }

      if (mountedRef.current) setLoading(false);
    }

    async function init() {
      try {
        const {
          data: { session },
          error,
        } = await withTimeout(supabase.auth.getSession(), 6000, "Session request");

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
      } catch (error) {
        console.error("Error initializing user:", error);
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
