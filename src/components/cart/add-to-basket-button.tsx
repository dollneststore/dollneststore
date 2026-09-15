"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonPrimary, buttonSoft } from "@/components/ui/styles";
import type { CartProduct } from "@/lib/types";
import { useCart } from "./use-cart";

type Props = {
  product: CartProduct;
  soldOut?: boolean;
  size?: "sm" | "lg";
};

export function AddToBasketButton({ product, soldOut = false, size = "sm" }: Props) {
  const { items, add } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const inBasket = items.find((i) => i.productId === product.productId);
  const atMax = Boolean(inBasket && inBasket.qty >= product.maxQty);
  const className = size === "lg" ? `${buttonPrimary} w-full` : `${buttonSoft} w-full`;

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 1800);
    return () => clearTimeout(timer);
  }, [justAdded]);

  if (soldOut) {
    return (
      <button type="button" disabled className={className}>
        Rehomed ♡
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={atMax && !justAdded}
        onClick={() => {
          add(product);
          setJustAdded(true);
        }}
        className={className}
      >
        <span aria-live="polite">{justAdded ? "Added to basket ♡" : atMax ? "In your basket ♡" : "Add to basket"}</span>
      </button>
      {size === "lg" && inBasket ? (
        <Link href="/basket" className="text-center text-sm font-bold text-lilac hover:underline">
          View basket & checkout →
        </Link>
      ) : null}
    </div>
  );
}
