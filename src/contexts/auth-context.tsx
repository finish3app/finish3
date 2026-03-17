"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { UserProfile, UserPreferences } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  preferences: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const profileFetchedRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const [profileRes, prefsRes] = await Promise.all([
        supabase.from("user_profiles").select("*").eq("id", userId).single(),
        supabase.from("user_preferences").select("*").eq("user_id", userId).single(),
      ]);

      if (profileRes.data) setProfile(profileRes.data as UserProfile);
      if (prefsRes.data) setPreferences(prefsRes.data as UserPreferences);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    profileFetchedRef.current = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Guard: only fetch profile once for the initial auth event
          if (!profileFetchedRef.current) {
            profileFetchedRef.current = true;
            await fetchProfile(session.user.id);
          }
        } else {
          profileFetchedRef.current = false;
          setProfile(null);
          setPreferences(null);
        }

        setLoading(false);
      }
    );

    // Fallback: if onAuthStateChange hasn't fired after 1s, check session directly
    const fallbackTimeout = setTimeout(async () => {
      if (!profileFetchedRef.current) {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user && !profileFetchedRef.current) {
          profileFetchedRef.current = true;
          await fetchProfile(session.user.id);
        }
        setLoading(false);
      }
    }, 1000);

    return () => {
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setPreferences(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, preferences, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
