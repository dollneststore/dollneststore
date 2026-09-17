"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/types";

export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];
  // Every photo gets describing text, not just the first: it is what image search reads,
  // and most imported photos have no description of their own.
  const describe = (image: ProductImage, index: number) => image.alt?.trim() || `${title} – photo ${index + 1}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-[28px] bg-blush">
        {current ? (
          <Image
            key={current.url}
            src={current.url}
            alt={describe(current, active)}
            fill
            preload
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
        ) : null}
      </div>
      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2" aria-label="Photos">
          {images.map((img, index) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show photo ${index + 1}`}
                aria-current={index === active}
                className={`relative block aspect-square w-full overflow-hidden rounded-2xl border-2 transition ${
                  index === active ? "border-lilac" : "border-transparent opacity-80 hover:opacity-100"
                }`}
              >
                {/* The button carries the spoken label, so this text is here for image search. */}
                <Image src={img.url} alt={describe(img, index)} fill sizes="120px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
