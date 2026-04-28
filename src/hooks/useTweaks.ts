'use client';

import { useCallback, useState } from 'react';

/**
 * useTweaks - Single source of truth for tweak values.
 * setTweak persists via the host (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
 * 
 * @param defaults - Default values for tweaks
 * @returns [values, setTweak] - Current tweak values and setter function
 */
export function useTweaks<T extends Record<string, unknown>>(defaults: T): [T, (key: keyof T, val: unknown) => void] {
  const [values, setValues] = useState<T>(defaults);

  const setTweak = useCallback((key: keyof T, val: unknown) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    // Post message to parent frame if in iframe context
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage(
        { type: '__edit_mode_set_keys', edits: { [key]: val } },
        '*'
      );
    }
  }, []);

  return [values, setTweak];
}
