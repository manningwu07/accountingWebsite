// app/layout.tsx
import "~/styles/globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "~/components/auth-provider";
import { Toaster } from "sonner";
import { Sidebar } from "~/components/sidebar";

export const metadata: Metadata = {
  title: "Zero-DB Accounting",
  description: "Accounting UI with Google Sheets storage (coming soon)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="flex">
            <Sidebar />
            <div className="flex min-h-screen grow flex-col">
              {/* Header right-aligned auth */}
              <div className="sticky top-0 z-10">
                {/* Keep header minimal */}
                {/* If you prefer, you can merge auth controls into sidebar */}
              </div>
              {children}
            </div>
          </div>
          <Toaster richColors position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}