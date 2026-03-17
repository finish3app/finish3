"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Sun, Inbox, LayoutGrid, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState("");
  const supabase = createClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  // Redirect if onboarding already completed
  useEffect(() => {
    if (!loading && profile?.onboarding_completed) {
      router.replace("/dashboard");
    }
  }, [profile, loading, router]);

  const totalSteps = 3;

  const handleNext = async () => {
    if (step === totalSteps - 1) {
      // Complete onboarding
      const name = workspaceName.trim() || "My Workspace";
      if (profile) {
        await supabase
          .from("user_profiles")
          .update({ onboarding_completed: true, workspace_name: name })
          .eq("id", profile.id);
        await refreshProfile();
      }
      router.replace("/dashboard");
    } else {
      setStep(step + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && workspaceName.trim()) {
      e.preventDefault();
      handleNext();
    }
  };

  // Show loading while checking auth state
  if (loading || !user || profile?.onboarding_completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center">
        
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="w-full max-w-lg mx-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 mb-10 overflow-hidden rounded-3xl shadow-lg border border-gray-100 flex items-center justify-center bg-white">
              <Image 
                src="/logo.svg" 
                alt="Finish3 Logo" 
                width={96} 
                height={96} 
                className="w-full h-full object-cover"
                priority
              />
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
              Welcome to Finish3
            </h1>
            <p className="text-lg text-gray-500 mb-12 font-medium">
              The simple productivity app that helps you focus on what matters most — just 3 things a day.
            </p>
            
            <button
              onClick={handleNext}
              className="px-8 py-3.5 bg-[#4B5CC4] hover:bg-[#3A4AB3] text-white rounded-full font-medium transition-colors text-[15px] shadow-sm"
            >
              Get started
            </button>
          </div>
        )}

        {/* Step 1: How it works (Feature Cards) */}
        {step === 1 && (
          <div className="w-full max-w-4xl flex flex-col items-center animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
              How Finish3 works
            </h2>
            <p className="text-[15px] text-gray-500 mb-12">
              A simple system designed to give you your focus back.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-12 text-left">
              {/* Card 1 */}
              <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col items-start transition-all hover:shadow-md hover:border-gray-200">
                <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600 mb-5">
                  <Sun className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-base">Your Daily Top 3</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed">
                  Pick exactly 3 tasks daily. No more, no less. This constraint is your superpower.
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col items-start transition-all hover:shadow-md hover:border-gray-200">
                <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600 mb-5">
                  <Inbox className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-base">Inbox for Everything Else</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed">
                  Capture all other tasks here. Move them to Today only when you&apos;re ready to focus.
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col items-start transition-all hover:shadow-md hover:border-gray-200">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 mb-5">
                  <LayoutGrid className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-base">Spaces for Projects</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed">
                  Organize tasks by project with Spaces — custom pages with rich text blocks and task lists.
                </p>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="px-10 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full font-medium transition-colors text-[14px]"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Name your workspace */}
        {step === 2 && (
          <div className="w-full max-w-lg mx-auto flex flex-col items-center animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
              Name your workspace
            </h2>
            <p className="text-[15px] text-gray-500 mb-10 text-center px-4">
              This could be your company, team, or personal workspace name.
            </p>

            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Acme Inc, My Projects"
              className="w-full max-w-sm px-6 py-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-base placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4B5CC4]/20 focus:border-[#4B5CC4] transition-all text-center font-medium mb-10 shadow-sm"
              autoFocus
              spellCheck={false}
            />

            <button
              onClick={handleNext}
              disabled={!workspaceName.trim()}
              className="px-8 py-3.5 bg-[#4B5CC4] hover:bg-[#3A4AB3] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-full font-medium transition-colors text-[15px] shadow-sm w-full max-w-sm"
            >
              Let&apos;s get started
            </button>
          </div>
        )}

      </div>

      {/* Pagination Dots */}
      <div className="pb-10 pt-4 flex justify-center gap-2.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === step ? "bg-gray-400 scale-125" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

    </div>
  );
}
