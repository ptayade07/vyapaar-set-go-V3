"use client";

import { Image as ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import { uploadShopLogo } from "@/backend/actions/shop-settings-actions";
import { useT } from "@/frontend/lib/i18n";

type Props = {
  currentLogoUrl: string | null;
};

export function LogoUpload({ currentLogoUrl }: Props) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t("Sirf image files allowed hain.", "Only image files are allowed."));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(t("Logo 2MB se chota hona chahiye.", "Logo must be under 2MB."));
      return;
    }

    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadShopLogo(formData);
    setUploading(false);

    if (!result.ok) {
      setPreview(currentLogoUrl);
      URL.revokeObjectURL(objectUrl);
      setError(
        result.reason === "too_large"
          ? t("Logo 2MB se chota hona chahiye.", "Logo must be under 2MB.")
          : t("Logo upload nahi hui.", "Logo upload failed."),
      );
    }
  }

  return (
    <div className="grid gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onPickFile}
        className="hidden"
      />
      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Shop logo" className="h-16 w-16 rounded-xl border border-gray-200 object-contain" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="tap-target rounded-xl border-2 border-dashed border-gray-300 px-4 text-sm font-bold text-gray-500 hover:border-orange-400 disabled:opacity-60"
        >
          {uploading
            ? t("Upload ho rahi hai...", "Uploading...")
            : preview
              ? t("Logo badlo", "Change logo")
              : t("Logo upload karo", "Upload logo")}
        </button>
      </div>
      {error ? <p className="text-xs font-bold text-red-700">{error}</p> : null}
    </div>
  );
}
