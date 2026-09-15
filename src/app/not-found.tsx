import Link from "next/link";
import { buttonPrimary } from "@/components/ui/styles";

export default function NotFound() {
  return (
    <main className="bg-nest grid flex-1 place-items-center px-4 py-24 text-center">
      <div>
        <p className="font-serif text-7xl text-lilac">404</p>
        <h1 className="mt-2 font-serif text-4xl">This little one has wandered off</h1>
        <p className="mt-3 text-muted">The page you&apos;re looking for doesn&apos;t exist or has been rehomed.</p>
        <Link href="/reborn-dolls" className={`${buttonPrimary} mt-7`}>
          Meet our babies ♡
        </Link>
      </div>
    </main>
  );
}
