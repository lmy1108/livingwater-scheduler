'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'lw-current-member';

interface StoredIdentity {
  id: number;
  name: string;
}

export function useIdentity() {
  const [identity, setIdentityState] = useState<StoredIdentity | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setIdentityState(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoaded(true);
  }, []);

  const setIdentity = useCallback((member: StoredIdentity) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
    setIdentityState(member);
  }, []);

  const clearIdentity = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIdentityState(null);
  }, []);

  return { identity, setIdentity, clearIdentity, loaded };
}
