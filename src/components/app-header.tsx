// components/app-header.tsx
"use client";

import { useAuth } from "./auth-provider";
import { signInWithGoogle, signOutUser } from "~/lib/firebase";
import { Button } from "~/components/ui/button";

export function AppHeader() {
  const { user, loading } = useAuth();

  return (
    <header className="flex items-center justify-end border-b bg-[hsl(var(--panel))] px-4 py-3">
      {loading ? (
        <div className="text-sm text-subtle">Loading...</div>
      ) : user ? (
        <div className="flex items-center gap-3">
          <div className="text-sm">{user.displayName ?? user.email}</div>
          <Button size="sm" onClick={() => void signOutUser()}>
            Sign out
          </Button>
        </div>
      ) : (
        <Button size="sm" onClick={() => void signInWithGoogle()}>
          Sign in with Google
        </Button>
      )}
    </header>
  );
}