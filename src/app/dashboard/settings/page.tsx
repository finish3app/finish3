"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { isPro, PLAN_FEATURES } from "@/lib/subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Settings, User, CreditCard, Volume2, Palette,
  Crown, Check, Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { user, profile, preferences } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(preferences?.sound_enabled ?? true);
  const [volume, setVolume] = useState([(preferences?.success_sound_volume ?? 0.6) * 100]);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [billingType, setBillingType] = useState<"monthly" | "yearly">("yearly");
  const supabase = createClient();
  const userIsPro = isPro(profile);

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const handleSoundToggle = async (enabled: boolean) => {
    setSoundEnabled(enabled);
    if (user) {
      await supabase.from("user_preferences").update({ sound_enabled: enabled }).eq("user_id", user.id);
    }
  };

  const handleVolumeChange = async (value: number[]) => {
    setVolume(value);
    if (user) {
      await supabase.from("user_preferences").update({ success_sound_volume: value[0] / 100 }).eq("user_id", user.id);
    }
  };

  const testSound = () => {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(volume[0] / 100 * 0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch {}
  };

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceType: billingType }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch("/api/stripe/create-portal-session", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-sm">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{profile?.full_name || "User"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className={!userIsPro ? "border-amber-500/20" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" /> Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={userIsPro ? "amber" : "secondary"} className="text-xs">
              {userIsPro ? "PRO" : "FREE"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {userIsPro ? "Full access to all features" : "Free plan — limited features"}
            </span>
          </div>

          {userIsPro ? (
            <Button variant="outline" size="sm" onClick={handleManageBilling}>
              Manage Billing
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Billing toggle */}
              <div className="flex items-center justify-center gap-3 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setBillingType("monthly")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingType === "monthly" ? "bg-background shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingType("yearly")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingType === "yearly" ? "bg-background shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Yearly <Badge variant="green" className="ml-1 text-[10px]">Save 33%</Badge>
                </button>
              </div>

              {/* Price */}
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {billingType === "monthly" ? "$8" : "$64"}
                  <span className="text-base font-normal text-muted-foreground">
                    /{billingType === "monthly" ? "mo" : "yr"}
                  </span>
                </p>
                {billingType === "yearly" && (
                  <p className="text-xs text-muted-foreground mt-1">~$5.33/month</p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2">
                {PLAN_FEATURES.pro.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button variant="brand" className="w-full" onClick={handleUpgrade} disabled={upgradeLoading}>
                {upgradeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sounds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Volume2 className="h-4 w-4" /> Sounds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Success sound</span>
            <Switch checked={soundEnabled} onCheckedChange={handleSoundToggle} />
          </div>
          {soundEnabled && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="text-muted-foreground">{volume[0]}%</span>
                </div>
                <Slider
                  value={volume}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={5}
                />
              </div>
              <Button variant="outline" size="sm" onClick={testSound}>
                Test Sound
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Coming soon — theme customization for Pro users.</p>
        </CardContent>
      </Card>
    </div>
  );
}
