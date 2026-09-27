import { Link, createFileRoute } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, GlassCard, PageShell, SectionHeading } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Settings — PACKWISE AI" },
      { name: "description", content: "Manage your PACKWISE AI profile and organization details." },
      { property: "og:title", content: "Profile & Settings — PACKWISE AI" },
      { property: "og:description", content: "Update your name, organization and role." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState({ name: "", organization: "", role: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void supabase.from("profiles").select("name, organization, role").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setForm({ name: data.name ?? "", organization: data.organization ?? "", role: data.role ?? "" });
    });
  }, [user]);

  if (loading) return <PageShell><div className="glass h-40 animate-pulse rounded-3xl" /></PageShell>;
  if (!user)
    return (
      <PageShell>
        <EmptyState icon={<UserRound className="size-5" />} title="Sign in to manage your profile" description="Your profile keeps analyses synced across devices." action={<Button asChild><Link to="/auth">Sign in</Link></Button>} />
      </PageShell>
    );

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...form });
    setSaving(false);
    if (error) toast.error("Could not save profile");
    else toast.success("Profile saved");
  };

  return (
    <PageShell className="max-w-2xl">
      <SectionHeading eyebrow="Profile" title="Your details" description={user.email ?? ""} />
      <GlassCard className="mt-6 space-y-5 p-6">
        {(["name", "organization", "role"] as const).map((k) => (
          <div key={k} className="space-y-2">
            <Label className="capitalize">{k}</Label>
            <Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
          </div>
        ))}
        <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </GlassCard>
    </PageShell>
  );
}
