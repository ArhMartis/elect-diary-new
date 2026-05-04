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
  const [isAnimating, setIsAnimating] = useState(false);

  const next = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent((c) => (c + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating]);

  const prev = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1));
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black/20 h-[300px] md:h-[400px] lg:h-[500px]">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-500 ease-out transform ${
              index === current
                ? "opacity-100 scale-100 translate-x-0 z-10"
                : index < current
                ? "opacity-0 scale-95 -translate-x-full z-0"
                : "opacity-0 scale-95 translate-x-full z-0"
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-cover"
              unoptimized
              priority={index === 0}
            />
            {/* Animated overlay gradient */}
            <div 
              className={`absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-500 ${
                index === current ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        ))}

        {/* Navigation buttons */}
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-white/30 backdrop-blur-sm border-0 hover:bg-white/60 text-white shadow-lg z-20 transition-transform hover:scale-110"
        >
          ❮
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-white/30 backdrop-blur-sm border-0 hover:bg-white/60 text-white shadow-lg z-20 transition-transform hover:scale-110"
        >
          ❯
        </button>

        {/* Slide indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (!isAnimating && i !== current) {
                  setIsAnimating(true);
                  setCurrent(i);
                  setTimeout(() => setIsAnimating(false), 600);
                }
              }}
              className={`h-2 rounded-full transition-all duration-300 hover:scale-125 ${
                i === current
                  ? "bg-white shadow-md w-8"
                  : "bg-white/40 hover:bg-white/60 w-2"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
