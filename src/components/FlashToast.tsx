"use client";

import { useEffect, useState } from "react";

export default function FlashToast({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // через 4.5 сек начинаем анимацию исчезновения
    const hideTimer = setTimeout(() => {
      setLeaving(true);
    }, 4500);

    // через 5 сек полностью убираем
    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, 5000);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="toast toast-top toast-end z-50 mt-16">
      <div
        className={`
          alert alert-success shadow-lg
          transition-all duration-500 ease-in-out
          ${leaving ? "opacity-0 translate-y-2 scale-95" : "opacity-100 translate-y-0 scale-100"}
        `}
      >
        <span>{message}</span>
      </div>
    </div>
  );
}
