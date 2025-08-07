import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notes Organizer",
  description: "A minimal online notes app.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
