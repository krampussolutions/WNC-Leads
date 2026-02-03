import "./globals.css";
import type { Metadata } from "next";

 export const metadata = {
  title: "WNC Leads – Find Trusted Contractors in Western North Carolina",
  description:
    "WNC Leads connects homeowners with local contractors and helps businesses get real quote requests. First month free for contractors.",
  openGraph: {
    title: "WNC Leads – Local Contractors. Real Leads.",
    description:
      "Western North Carolina’s local contractor directory. First month free for contractors.",
    url: "https://wncleads.com",
    siteName: "WNC Leads",
    images: [
      {
        url: "https://wncleads.com/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
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
