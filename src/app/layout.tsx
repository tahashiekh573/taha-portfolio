import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/providers/toaster";
import { getSiteContent } from "@/lib/content";
import { resolveSiteUrl } from "@/lib/site-url";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { settings, profile } = await getSiteContent();
  const siteUrl = resolveSiteUrl(settings.siteUrl);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: settings.seoTitle, template: `%s | ${profile.name}` },
    description: settings.seoDescription,
    keywords: settings.keywords,
    authors: [{ name: profile.name, url: profile.github }],
    creator: profile.name,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName: `${profile.name} — Portfolio`,
      title: settings.seoTitle,
      description: settings.seoDescription,
    },
    twitter: { card: "summary_large_image", title: settings.seoTitle, description: settings.seoDescription },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#060a16" },
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { settings } = await getSiteContent();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-accent={settings.accent}
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
    >
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
