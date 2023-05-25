import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Dennis Hedegaard",
  description: "The personal website of Dennis Hedegaard",
  manifest: "/manifest.json",
  themeColor: "#fff",
  appleWebApp: {
    capable: true,
    title: "Dennis Hedegaard",
  },
  openGraph: {
    type: "website",
    title: "Dennis Hedegaard",
    siteName: "Dennis Hedegaard",
    url: "https://www.dhedegaard.dk/",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        <div className="max-w-4xl mx-auto px-6 max-md:px-4">{children}</div>
      </body>
    </html>
  );
}
