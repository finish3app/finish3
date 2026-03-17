import type { UserProfile } from "@/lib/types";

export function isPro(profile: UserProfile | null): boolean {
  return profile?.subscription_status === "pro";
}

export function isFree(profile: UserProfile | null): boolean {
  return !profile || profile.subscription_status === "free";
}

export function canCreateSpace(profile: UserProfile | null, currentSpaceCount: number): boolean {
  if (isPro(profile)) return true;
  return currentSpaceCount < 1;
}

export function canUseLabels(profile: UserProfile | null): boolean {
  return isPro(profile);
}

export function canViewFullInsights(profile: UserProfile | null): boolean {
  return isPro(profile);
}

export function canUseThemes(profile: UserProfile | null): boolean {
  return isPro(profile);
}

export function getMaxSpaces(profile: UserProfile | null): number {
  return isPro(profile) ? Infinity : 1;
}

export const PLAN_FEATURES = {
  free: {
    name: "Free",
    price: "$0",
    features: [
      "Today (Daily Top 3)",
      "Inbox",
      "1 Space",
      "Basic Insights (weekly count)",
      "Sound settings",
    ],
  },
  pro: {
    name: "Pro",
    monthlyPrice: "$8/month",
    yearlyPrice: "$64/year",
    yearlySavings: "Save 33%",
    features: [
      "Everything in Free",
      "Unlimited Spaces",
      "Full Insights & Trends",
      "Unlimited Labels",
      "Appearance & Themes",
      "Priority Support",
    ],
  },
};
