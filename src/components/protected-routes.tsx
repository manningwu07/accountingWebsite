"use client";

import { useAuth } from "~/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/"); // redirect to homepage
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-100">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null; // nothing while redirecting
  }

  return <>{children}</>;
}