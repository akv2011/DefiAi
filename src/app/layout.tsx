import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import { Analytics } from "@vercel/analytics/next";

import ClientProviders from "@/components/shared/ClientProviders";
import { Toaster } from "@/components/ui/toaster";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Matrix - The Matrix",
  description: "Enter The Matrix",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Google tag (gtag.js) */}
      <Script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-4GE29E2KMY"
      />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-4GE29E2KMY');
        `}
      </Script>

      {/* Trackdesk tracker */}
      <Script async src="//cdn.trackdesk.com/tracking.js" />
      <Script id="trackdesk-tracking">
        {`
          (function(t,d,k){(t[k]=t[k]||[]).push(d);t[d]=t[d]||t[k].f||function(){(t[d].q=t[d].q||[]).push(arguments)}})(window,"trackdesk","TrackdeskObject");
          // Track page view with additional parameters to differentiate from interaction clicks
          trackdesk("matrix", "click", {
            eventLabel: "page_view",
            pageUrl: window.location.href,
            pageTitle: document.title,
            customParams: {
              advS1: "page_view"
            }
          });
        `}
      </Script>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-gray-100 dark:bg-neutral-900 dark:text-white`}
      >
        <ClientProviders>
          {children}
          <Analytics />
          <Toaster />
        </ClientProviders>
      </body>
    </html>
  );
}
