import { Suspense } from "react";
import { AnnouncementBar } from "@/components/site/announcement-bar";
import { BottomNav, BottomNavShell } from "@/components/site/bottom-nav";
import { Footer } from "@/components/site/footer";
import { Header, HeaderShell } from "@/components/site/header";
import { WelcomePopup } from "@/components/site/welcome-popup";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { getSiteSettings, resolveSettings } from "@/lib/data/catalog";
import { fallback } from "@/lib/errors";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // Settings are cached; a failure degrades to the defaults rather than taking the shop down.
  const { socials, popup } = await getSiteSettings().catch(fallback(resolveSettings(null), "[shop layout] settings"));

  return (
    <div className="bg-nest flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-bold"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      {/* usePathname suspends on routes with params not known at build time. */}
      <Suspense fallback={<HeaderShell pathname={null} tiktok={socials.tiktok} />}>
        <Header tiktok={socials.tiktok} />
      </Suspense>
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <Suspense fallback={<BottomNavShell pathname={null} />}>
        <BottomNav />
      </Suspense>
      <WhatsAppButton />
      <Suspense fallback={null}>
        <WelcomePopup popup={popup} />
      </Suspense>
    </div>
  );
}
