import type { ReactNode } from "react";
import "../styles/globals.css";

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
