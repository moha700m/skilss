import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { Providers } from "@/components/providers";
import { AgentDock } from "@/components/agent/agent-dock";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const arabicSans = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://skillatlas.dev").replace(/\/$/, "");
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "SkillAtlas",
      url: siteUrl,
      inLanguage: ["ar", "en"],
      description: "A bilingual directory and keyless agent for practical AI-agent skills.",
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/explore?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/agent#application`,
      name: "Atlas Zero",
      url: `${siteUrl}/agent`,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Modern web browser",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SkillAtlas — أطلس مهارات وكلاء الذكاء الاصطناعي",
    template: "%s | SkillAtlas",
  },
  description:
    "دليل عربي وإنجليزي لاكتشاف مهارات Claude وCodex ووكلاء الذكاء الاصطناعي، مع بحث سريع ومصادر وتفاصيل تثبيت واضحة.",
  applicationName: "SkillAtlas",
  keywords: [
    "Claude Skills",
    "Codex Skills",
    "AI agent skills",
    "مهارات الذكاء الاصطناعي",
    "awesome-claude-skills",
  ],
  authors: [{ name: "SkillAtlas contributors" }],
  creator: "SkillAtlas",
  openGraph: {
    type: "website",
    locale: "ar_SA",
    alternateLocale: "en_US",
    siteName: "SkillAtlas",
    title: "SkillAtlas — Skills, mapped",
    description: "Discover, inspect, and install practical skills for AI agents.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillAtlas — Skills, mapped",
    description: "Discover practical skills for Claude, Codex, Cursor, and more.",
  },
  alternates: { canonical: "/" },
  category: "technology",
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#111117" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${arabicSans.variable}`}
    >
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <Providers>
          <a
            href="#main-content"
            className="fixed start-4 top-3 z-[100] -translate-y-20 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform focus:translate-y-0"
          >
            تخطَّ إلى المحتوى
          </a>
          <div className="flex min-h-dvh flex-col">
            <SiteHeader />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
          <AgentDock />
        </Providers>
      </body>
    </html>
  );
}
