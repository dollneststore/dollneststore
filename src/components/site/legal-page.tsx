import { container } from "@/components/ui/styles";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <article className={`${container} max-w-3xl pt-[clamp(28px,4vw,56px)] pb-[clamp(56px,7vw,96px)]`}>
      <h1 className="font-serif text-[clamp(38px,5vw,56px)] leading-none font-medium">{title}</h1>
      <p className="mt-3 text-sm text-muted">Last updated {updated}</p>
      <div className="legal-prose">{children}</div>
    </article>
  );
}
