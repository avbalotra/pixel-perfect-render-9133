import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard, PageShell, SectionHeading } from "@/components/ui-kit";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — PACKWISE AI" },
      { name: "description", content: "Sign in to save packaging analyses, history and reports in PACKWISE AI." },
      { property: "og:title", content: "Sign in — PACKWISE AI" },
      { property: "og:description", content: "Sign in to save packaging analyses, history and reports." },
    ],
  }),
  component: AuthPage,
});

const ROLES = ["Industry", "Farmer", "Researcher", "Student", "Packaging Manufacturer", "Other"];

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("Industry");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/" });
  }, [user, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || password.length < 6) {
      toast.error("Check your details", { description: "Enter an email and a password of at least 6 characters." });
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name, organization, role },
          },
        });
        if (error) throw error;
        if (data.user && data.session) {
          await supabase.from("profiles").upsert({ id: data.user.id, name, organization, role });
          toast.success("Account created");
        } else {
          toast.success("Check your inbox", { description: "Confirm your email address to finish signing up." });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
    } catch (error) {
      toast.error("Authentication failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Google sign-in failed", { description: "Please try again or use email and password." });
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    setBusy(false);
  };

  return (
    <PageShell className="max-w-xl">
      <SectionHeading
        eyebrow="Account"
        title={mode === "signin" ? "Sign in to PACKWISE AI" : "Create your PACKWISE AI account"}
        description="Signing in saves your analyses, history and generated reports. You can also explore the prototype as a guest — guest analyses stay in this browser."
      />

      <GlassCard className="mt-8 p-6 sm:p-8">
        <Button type="button" variant="outline" className="w-full rounded-xl bg-card" onClick={() => void google()} disabled={busy}>
          Continue with Google
        </Button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or use email
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Asha Menon" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="organization">Organisation</Label>
                  <Input
                    id="organization"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="FreshChain Foods"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          <Button type="submit" className="w-full rounded-xl" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-5 w-full text-sm text-muted-foreground transition-colors hover:text-primary"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </GlassCard>
    </PageShell>
  );
}
