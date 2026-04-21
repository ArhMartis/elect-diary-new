"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const slides = [
  { src: "/carousel/1.jpg", alt: "Слайд 1" },
  { src: "/carousel/2.jpg", alt: "Слайд 2" },
  { src: "/carousel/3.jpg", alt: "Слайд 3" },
  { src: "/carousel/4.jpg", alt: "Слайд 4" },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1));
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black/20">
        <Image
          src={slides[current].src}
          alt={slides[current].alt}
          width={1200}
          height={600}
          className="w-full object-cover transition-all duration-300"
          unoptimized
          priority
        />

        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-white/30 backdrop-blur-sm border-0 hover:bg-white/60 text-white shadow-lg"
        >
          ❮
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-white/30 backdrop-blur-sm border-0 hover:bg-white/60 text-white shadow-lg"
        >
          ❯
        </button>
      </div>

      <div className="flex justify-center w-full py-3 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-8 h-2 rounded-full transition-all ${
              i === current
                ? "bg-white shadow-md scale-110"
                : "bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
