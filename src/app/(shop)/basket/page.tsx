import type { Metadata } from "next";
import { BasketView } from "@/components/cart/basket-view";
import { container } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Your basket",
  robots: { index: false },
};

export default function BasketPage() {
  return (
    <div className={`${container} pt-[clamp(28px,4vw,56px)] pb-[clamp(56px,7vw,96px)]`}>
      <h1 className="mb-8 font-serif text-[clamp(38px,5vw,56px)] leading-none font-medium">Your basket</h1>
      <BasketView />
    </div>
  );
}
