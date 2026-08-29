'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SalarySecurityService, type StepUpStatus } from '@/services/salarySecurityService';

/**
 * Whether this user may currently see other people's salary figures, and for how much longer.
 *
 * <p>The countdown is cosmetic. Nothing here decides what is visible — the server withholds the
 * figures and this only reports the state of the grant, so a bug in the timer cannot reveal a salary.
 * When the countdown reaches zero the state is re-read from the server rather than assumed.
 */
export function useSalaryReveal(organizationId: string | undefined) {
  const [status, setStatus] = useState<StepUpStatus>({ active: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!organizationId) return;
    try {
      const s = await SalarySecurityService.status(organizationId);
      setStatus(s);
      setSecondsLeft(s.secondsRemaining ?? 0);
    } catch {
      // A status we cannot read is treated as "not revealed" — the safe direction.
      setStatus({ active: false });
      setSecondsLeft(0);
    }
  }, [organizationId]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!status.active) return;
    timer.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          void refresh();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [status.active, refresh]);

  const reveal = useCallback(async (password: string) => {
    if (!organizationId) return false;
    setLoading(true);
    setError(null);
    try {
      const s = await SalarySecurityService.stepUp(organizationId, password);
      setStatus(s);
      setSecondsLeft(s.secondsRemaining ?? 0);
      return true;
    } catch (e: any) {
      setError(e?.message || 'That password was not correct.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const lockNow = useCallback(async () => {
    if (!organizationId) return;
    try {
      await SalarySecurityService.lockNow(organizationId);
    } finally {
      await refresh();
    }
  }, [organizationId, refresh]);

  return { status, secondsLeft, loading, error, reveal, lockNow, refresh };
}
