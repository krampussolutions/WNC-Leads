import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WNC Leads",
  description: "Contractors and Realtors in Western North Carolina",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
