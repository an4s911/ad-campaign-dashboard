"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const LEAVE_MESSAGE =
  "You have unsaved changes. Leave this page and discard them?";

type UnsavedChangesContextValue = {
  isBlocked: boolean;
  setIsBlocked: (blocked: boolean) => void;
  confirmDiscardChanges: () => boolean;
  clearUnsavedChanges: () => void;
  allowNavigation: <T>(action: () => T) => T;
  guardedPush: (href: string) => void;
  guardedReplace: (href: string) => void;
  guardedBack: (fallbackHref?: string) => void;
};

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(
  null
);

export function UnsavedChangesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isBlocked, setIsBlocked] = useState(false);
  const isBlockedRef = useRef(false);
  const historyGuardEnabledRef = useRef(false);
  const ignoreNextPopRef = useRef(false);
  const navigationAllowedRef = useRef(false);

  useEffect(() => {
    isBlockedRef.current = isBlocked;
  }, [isBlocked]);

  useEffect(() => {
    navigationAllowedRef.current = false;
    ignoreNextPopRef.current = false;
  }, [pathname, searchParams]);

  const confirmDiscardChanges = useCallback(() => {
    if (!isBlockedRef.current || navigationAllowedRef.current) {
      return true;
    }

    return window.confirm(LEAVE_MESSAGE);
  }, []);

  const allowNavigation = useCallback(<T,>(action: () => T) => {
    navigationAllowedRef.current = true;
    historyGuardEnabledRef.current = false;
    return action();
  }, []);

  const clearUnsavedChanges = useCallback(() => {
    setIsBlocked(false);
    navigationAllowedRef.current = false;

    if (!historyGuardEnabledRef.current) {
      return;
    }

    historyGuardEnabledRef.current = false;
    ignoreNextPopRef.current = true;
    window.history.back();
  }, []);

  useEffect(() => {
    if (!isBlocked || historyGuardEnabledRef.current) {
      return;
    }

    window.history.pushState(
      {
        ...(window.history.state ?? {}),
        __unsavedChangesGuard: true,
      },
      "",
      window.location.href
    );
    historyGuardEnabledRef.current = true;
  }, [isBlocked]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isBlockedRef.current || navigationAllowedRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = true;
    }

    function handleDocumentClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !isBlockedRef.current ||
        navigationAllowedRef.current
      ) {
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;

      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      const isSameDocument =
        nextUrl.origin === currentUrl.origin &&
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search;

      if (isSameDocument) {
        return;
      }

      event.preventDefault();

      if (!window.confirm(LEAVE_MESSAGE)) {
        return;
      }

      allowNavigation(() => {
        if (nextUrl.origin === currentUrl.origin) {
          router.push(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
          return;
        }

        window.location.assign(anchor.href);
      });
    }

    function handlePopState() {
      if (ignoreNextPopRef.current) {
        ignoreNextPopRef.current = false;
        return;
      }

      if (!isBlockedRef.current || navigationAllowedRef.current) {
        historyGuardEnabledRef.current = false;
        return;
      }

      if (window.confirm(LEAVE_MESSAGE)) {
        allowNavigation(() => {
          window.history.back();
        });
        return;
      }

      window.history.pushState(
        {
          ...(window.history.state ?? {}),
          __unsavedChangesGuard: true,
        },
        "",
        window.location.href
      );
      historyGuardEnabledRef.current = true;
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [allowNavigation, router]);

  const guardedPush = useCallback(
    (href: string) => {
      if (!confirmDiscardChanges()) {
        return;
      }

      allowNavigation(() => {
        router.push(href);
      });
    },
    [allowNavigation, confirmDiscardChanges, router]
  );

  const guardedReplace = useCallback(
    (href: string) => {
      if (!confirmDiscardChanges()) {
        return;
      }

      allowNavigation(() => {
        router.replace(href);
      });
    },
    [allowNavigation, confirmDiscardChanges, router]
  );

  const guardedBack = useCallback(
    (fallbackHref = "/") => {
      if (!confirmDiscardChanges()) {
        return;
      }

      allowNavigation(() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }

        router.push(fallbackHref);
      });
    },
    [allowNavigation, confirmDiscardChanges, router]
  );

  const value = useMemo(
    () => ({
      isBlocked,
      setIsBlocked,
      confirmDiscardChanges,
      clearUnsavedChanges,
      allowNavigation,
      guardedPush,
      guardedReplace,
      guardedBack,
    }),
    [
      isBlocked,
      confirmDiscardChanges,
      clearUnsavedChanges,
      allowNavigation,
      guardedPush,
      guardedReplace,
      guardedBack,
    ]
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);

  if (!context) {
    throw new Error(
      "useUnsavedChanges must be used within an UnsavedChangesProvider"
    );
  }

  return context;
}

export function useUnsavedChangesGuard(isDirty: boolean) {
  const {
    setIsBlocked,
    clearUnsavedChanges,
    allowNavigation,
    guardedPush,
    guardedReplace,
    guardedBack,
  } = useUnsavedChanges();

  useEffect(() => {
    setIsBlocked(isDirty);

    return () => {
      setIsBlocked(false);
    };
  }, [isDirty, setIsBlocked]);

  return {
    clearUnsavedChanges,
    allowNavigation,
    guardedPush,
    guardedReplace,
    guardedBack,
  };
}
