import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ImageCarousel({ images, alt, className = "" }: { images: string[]; alt: string; className?: string }) {
  const [i, setI] = useState(0);
  if (!images || images.length === 0) return null;
  const prev = () => setI((p) => (p - 1 + images.length) % images.length);
  const next = () => setI((p) => (p + 1) % images.length);
  return (
    <div className={`relative overflow-hidden bg-paper-rule ${className}`}>
      <img
        src={images[i]}
        alt={alt}
        className="block w-full h-full object-cover"
        loading="lazy"
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-ink-deep/80 text-paper p-1.5 hover:bg-ink-deep transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-ink-deep/80 text-paper p-1.5 hover:bg-ink-deep transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`block w-1.5 h-1.5 rounded-full ${idx === i ? "bg-paper" : "bg-paper/40"}`}
              />
            ))}
          </div>
          <div className="absolute top-2 right-2 font-mono text-[10px] tracking-widest bg-ink-deep/80 text-paper px-1.5 py-0.5">
            {i + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
}
