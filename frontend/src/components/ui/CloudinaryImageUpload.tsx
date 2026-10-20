"use client";

import { useRef, useState } from "react";
import { api, ApiError } from "@/src/lib/api/client";

type UploadFolder = "profile-images" | "organization-logos" | "pageant-images" | "contestant-photos" | "subscription-payment-proofs";

export function CloudinaryImageUpload({
  value,
  onChange,
  folder,
  label = "Upload image",
  rounded = false,
  dark = false,
  onUploadingChange,
}: {
  value?: string | null;
  onChange: (url: string) => void;
  folder: UploadFolder;
  label?: string;
  rounded?: boolean;
  dark?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      setError("Choose an image file no larger than 10 MB.");
      return;
    }
    setError("");
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const { data: signature } = await api.post<{
        cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string;
      }>("/api/cloudinary/signature", { folder });
      const body = new FormData();
      body.append("file", file);
      body.append("api_key", signature.apiKey);
      body.append("timestamp", String(signature.timestamp));
      body.append("folder", signature.folder);
      body.append("signature", signature.signature);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, { method: "POST", body });
      const result = await response.json();
      if (!response.ok || typeof result.secure_url !== "string") throw new Error(result.error?.message ?? "Image upload failed.");
      onChange(result.secure_url);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.userMessage : cause instanceof Error ? cause.message : "Image upload failed.");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {value && <img src={value} alt="Selected image" className={`h-16 w-16 border object-cover ${dark ? "border-white/20" : "border-border"} ${rounded ? "rounded-full" : "rounded"}`} />}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => void upload(event.target.files?.[0])} />
      <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className={`h-9 border px-3 text-small font-medium disabled:opacity-50 ${dark ? "border-white/20 text-white hover:border-gold/60" : "border-border text-charcoal hover:border-navy"}`}>
        {uploading ? "Uploading…" : label}
      </button>
      {value && <button type="button" disabled={uploading} onClick={() => onChange("")} className="text-small text-error disabled:opacity-50">Remove</button>}
      {error && <p role="alert" className="w-full text-caption text-error">{error}</p>}
    </div>
  );
}
