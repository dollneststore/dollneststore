import { Suspense } from "react";
import { AnnouncementBar } from "@/components/site/announcement-bar";
import { BottomNav, BottomNavShell } from "@/components/site/bottom-nav";
import { Footer } from "@/components/site/footer";
import { Header, HeaderShell } from "@/components/site/header";
import { WhatsAppButton } from "@/components/site/whatsapp-button";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
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
      <Suspense fallback={<HeaderShell pathname={null} />}>
        <Header />
      </Suspense>
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <Suspense fallback={<BottomNavShell pathname={null} />}>
        <BottomNav />
      </Suspense>
      <WhatsAppButton />
    </div>
  );
}
