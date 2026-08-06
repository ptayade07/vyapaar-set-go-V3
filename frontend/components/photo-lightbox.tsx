"use client";

import { useEffect, useState } from "react";

type ThumbnailProps = {
  src: string;
  alt: string;
};

export function PhotoThumbnail({ src, alt }: ThumbnailProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </button>
      {open ? <PhotoLightbox src={src} alt={alt} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

type LightboxProps = {
  src: string;
  alt: string;
  onClose: () => void;
};

export function PhotoLightbox({ src, alt, onClose }: LightboxProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[95vh] max-w-full rounded-lg object-contain"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="tap-target absolute right-4 top-4 rounded-full bg-white/10 px-4 text-lg font-bold text-white hover:bg-white/20"
      >
        Close
      </button>
    </div>
  );
}
