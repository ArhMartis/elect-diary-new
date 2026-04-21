"use client";

import { useState } from "react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackText?: string;
}

export default function Avatar({ src, alt = "avatar", className = "", fallbackText = "?" }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold border-2 border-white/50 ${className}`}>
        {fallbackText.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`w-9 h-9 rounded-full object-cover border-2 border-white/50 ${className}`}
      onError={() => setImgError(true)}
    />
  );
}