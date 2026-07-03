import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type SharedDocKind = "note" | "task" | "mindmap" | "markdown";

export interface SharedDoc {
  id: string;
  owner_id: string;
  kind: SharedDocKind;
  title: string | null;
  content: any;
  share_token: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Subscribe to a shared doc by token: fetches initial + listens to realtime updates
 * + tracks live viewer count via Supabase Presence.
 */
export function useSharedDoc(token: string | undefined) {
  const [doc, setDoc] = useState<SharedDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    let channel: RealtimeChannel | null = null;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("shared_docs")
        .select("*")
        .eq("share_token", token)
        .maybeSingle();
      if (!mounted) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (!data) {
        setError("المستند غير موجود أو تم إلغاء المشاركة");
        setLoading(false);
        return;
      }
      setDoc(data as SharedDoc);
      setLoading(false);

      const viewerId = crypto.randomUUID();
      channel = supabase
        .channel(`shared_doc:${token}`, {
          config: { presence: { key: viewerId } },
        })
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "shared_docs",
            filter: `share_token=eq.${token}`,
          },
          (payload) => {
            if (mounted) setDoc(payload.new as SharedDoc);
          }
        )
        .on("presence", { event: "sync" }, () => {
          if (!channel || !mounted) return;
          const state = channel.presenceState();
          setViewers(Object.keys(state).length);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED" && channel) {
            await channel.track({ online_at: new Date().toISOString() });
          }
        });
    })();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [token]);

  return { doc, loading, error, viewers };
}

/**
 * Owner-side hook: creates or updates a shared_doc entry, throttled broadcasts.
 */
export function useLiveShareOwner(kind: SharedDocKind) {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewers, setViewers] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pendingRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const docIdRef = useRef<string | null>(null);

  const startSharing = useCallback(
    async (title: string, initialContent: any) => {
      setCreating(true);
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) {
        setCreating(false);
        throw new Error("يجب تسجيل الدخول لبدء المشاركة");
      }
      const { data, error } = await supabase
        .from("shared_docs")
        .insert({ owner_id: uid, kind, title, content: initialContent })
        .select("*")
        .single();
      setCreating(false);
      if (error || !data) throw error ?? new Error("فشل إنشاء المشاركة");
      docIdRef.current = data.id;
      setShareToken(data.share_token);

      // presence channel to count viewers
      const ch = supabase
        .channel(`shared_doc:${data.share_token}`, {
          config: { presence: { key: uid } },
        })
        .on("presence", { event: "sync" }, () => {
          if (!ch) return;
          setViewers(Object.keys(ch.presenceState()).length);
        })
        .subscribe(async (s) => {
          if (s === "SUBSCRIBED") await ch.track({ role: "owner" });
        });
      channelRef.current = ch;
      return data.share_token as string;
    },
    [kind]
  );

  const pushUpdate = useCallback((content: any) => {
    pendingRef.current = content;
    if (timerRef.current != null) return;
    timerRef.current = window.setTimeout(async () => {
      timerRef.current = null;
      const payload = pendingRef.current;
      pendingRef.current = null;
      if (!docIdRef.current) return;
      await supabase
        .from("shared_docs")
        .update({ content: payload })
        .eq("id", docIdRef.current);
    }, 500);
  }, []);

  const stopSharing = useCallback(async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (docIdRef.current) {
      await supabase.from("shared_docs").delete().eq("id", docIdRef.current);
      docIdRef.current = null;
    }
    setShareToken(null);
    setViewers(0);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) clearTimeout(timerRef.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  return { shareToken, creating, viewers, startSharing, pushUpdate, stopSharing };
}
