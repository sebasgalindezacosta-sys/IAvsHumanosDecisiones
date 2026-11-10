"use client";

import { useEffect } from "react";

/** Descarga en segundo plano las imágenes de los ensayos (quedan en caché). */
export function usePreloadImages(urls: string[]) {
  useEffect(() => {
    const keep: HTMLImageElement[] = [];
    for (const u of urls) {
      const im = new Image();
      im.decoding = "async";
      im.src = u;
      keep.push(im);
    }
    return () => {
      keep.length = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
