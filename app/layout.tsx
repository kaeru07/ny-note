import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ny-note",
  description: "Simple note app with Supabase"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
