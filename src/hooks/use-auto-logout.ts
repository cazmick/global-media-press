import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { QueryClient } from "@tanstack/react-query";

const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes

const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "click", "scroll"];

export function useAutoLogout(queryClient: QueryClient) {
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef<boolean>(false);

  const performLogout = useCallback(async () => {
    if (!sessionRef.current) return;
    sessionRef.current = false;

    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/IamBoss", replace: true });
  }, [queryClient, navigate]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!sessionRef.current) return;
    timerRef.current = setTimeout(performLogout, INACTIVITY_MS);
  }, [performLogout]);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      const hasSession = !!data.session && !error;
      sessionRef.current = hasSession;
      resetTimer();
    };

    const handleActivity = () => resetTimer();

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      const hasSession = event !== "SIGNED_OUT";
      sessionRef.current = hasSession;
      resetTimer();
    });

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      mounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      authListener.subscription.unsubscribe();
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer]);
}
