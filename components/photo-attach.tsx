"use client";

import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { uploadTransactionPhoto } from "@/app/actions";

export function PhotoAttach() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Sirf image files allowed hain.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Photo 8MB se choti honi chahiye.");
      return;
    }

    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadTransactionPhoto(formData);
    setUploading(false);

    if (result.ok) {
      setPhotoUrl(result.url);
    } else {
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
      setError(result.reason === "too_large" ? "Photo 8MB se choti honi chahiye." : "Photo upload nahi hui.");
    }
  }

  function removePhoto() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPhotoUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-2">
      <input type="hidden" name="photoUrl" value={photoUrl ?? ""} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPickFile}
        className="hidden"
      />
      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Receipt preview" className="h-32 w-full rounded-xl object-cover" />
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 text-sm font-bold text-white">
              Uploading...
            </div>
          ) : (
            <button
              type="button"
              onClick={removePhoto}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm font-black text-white"
            >
              ×
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="tap-target flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-sm font-bold text-gray-500 hover:border-orange-400"
        >
          <Camera className="h-4 w-4" /> Photo attach karo
        </button>
      )}
      {error ? <p className="text-xs font-bold text-red-700">{error}</p> : null}
    </div>
  );
}
