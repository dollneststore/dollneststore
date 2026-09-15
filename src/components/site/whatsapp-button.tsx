import { WhatsAppIcon } from "@/components/icons";
import { site, whatsappUrl } from "@/lib/site";

export function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with Dollnest on WhatsApp (${site.whatsapp.display})`}
      className="group fixed right-4 bottom-[calc(84px+env(safe-area-inset-bottom))] z-30 flex items-center gap-2 rounded-full bg-whatsapp p-3.5 text-white shadow-[0_10px_30px_rgba(37,211,102,.35)] transition-transform hover:scale-105 lg:right-6 lg:bottom-6"
    >
      <WhatsAppIcon className="size-7" />
      <span className="hidden pr-1.5 text-sm font-bold lg:inline">Chat with us</span>
    </a>
  );
}
