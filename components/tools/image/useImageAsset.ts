"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_IMAGE_BYTES, type ImageAsset } from "@/components/tools/image/image-utils";

export function useImageAsset() {
  const [asset, setAsset] = useState<ImageAsset | null>(null);
  const [error, setError] = useState("");
  const previewUrlRef = useRef("");
  const requestRef = useRef(0);

  const clear = useCallback(() => {
    requestRef.current += 1;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = "";
    setAsset(null);
    setError("");
  }, []);

  const selectFile = useCallback(async (file?: File) => {
    clear();
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Choose a supported image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Choose an image smaller than 50 MB.");
      return;
    }

    const requestId = requestRef.current;
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new window.Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("This image could not be opened."));
        element.src = previewUrl;
      });

      if (requestRef.current !== requestId) {
        URL.revokeObjectURL(previewUrl);
        return;
      }

      setAsset({
        file,
        previewUrl,
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    } catch (caught) {
      if (requestRef.current === requestId) {
        URL.revokeObjectURL(previewUrl);
        previewUrlRef.current = "";
        setError(caught instanceof Error ? caught.message : "This image could not be opened.");
      }
    }
  }, [clear]);

  useEffect(() => () => {
    requestRef.current += 1;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  return { asset, error, selectFile, clear };
}