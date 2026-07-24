"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Debounce a value; fires onChange after delay when value stabilizes.
 */
export function useDebouncedCallback<T extends unknown[]>(
    callback: (...args: T) => void | Promise<void>,
    delayMs: number
) {
    const callbackRef = useRef(callback);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingRef = useRef(false);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const [isPending, setIsPending] = useState(false);

    function cancel() {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        pendingRef.current = false;
        setIsPending(false);
    }

    function schedule(...args: T) {
        pendingRef.current = true;
        setIsPending(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
            timerRef.current = null;
            pendingRef.current = false;
            try {
                await callbackRef.current(...args);
            } finally {
                setIsPending(false);
            }
        }, delayMs);
    }

    function flush(...args: T) {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        pendingRef.current = false;
        setIsPending(false);
        return callbackRef.current(...args);
    }

    function hasPending() {
        return pendingRef.current;
    }

    return { schedule, cancel, flush, isPending, hasPending };
}
