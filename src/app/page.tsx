"use client";

import { useAuth } from "~/components/auth-provider";
import { signInWithGoogle, signOutUser } from "~/lib/firebase";
import { Button } from "~/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <main className="min-h-screen bg-[hsl(var(--bg))] text-zinc-100 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to Zero-DB Accounting</h1>
      <p className="text-lg text-zinc-400 max-w-xl text-center mb-8">
        Track your sales, costs, and profits — all stored securely in your own Google Drive.
        No database costs. No hassle.
      </p>

      {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg">Signed in as {user.displayName ?? user.email}</p>
          <div className="flex gap-4">
            <Link href="/analysis">
              <Button className="btn-accent">Go to Analysis</Button>
            </Link>
            <Link href="/edit">
              <Button variant="secondary">Go to Edit Mode</Button>
            </Link>
            <Button variant="destructive" onClick={() => void signOutUser()}>
              Sign Out
            </Button>
          </div>
        </div>
      ) : (
        <Button className="btn-accent" onClick={() => void signInWithGoogle()}>
          Sign in with Google
        </Button>
      )}
    </main>
  );
}