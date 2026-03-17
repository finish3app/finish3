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
  const initializedRef = useRef(false);

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
    // Immediately restore session on mount — this is the primary mechanism
    const initSession = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (currentUser) {
          setUser(currentUser);
          // Also get the session for the session object
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          setSession(currentSession);
          await fetchProfile(currentUser.id);
        }
      } catch (error) {
        console.error("Error restoring session:", error);
      } finally {
        initializedRef.current = true;
        setLoading(false);
      }
    };

    initSession();

    // Listen for subsequent auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, newSession: Session | null) => {
        // Skip if this is the initial event and we already handled it above
        if (!initializedRef.current) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          if (event === "SIGNED_IN") {
            await fetchProfile(newSession.user.id);
          }
        } else {
          setProfile(null);
          setPreferences(null);
        }
      }
    );

    return () => {
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

