/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// lib/cloudinary.ts
export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
};
export async function uploadToCloudinary(
  file: File,
  opts?: { publicId?: string; folder?: string }
) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signRes = await fetch("/api/cloudinary-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      timestamp,
      folder: opts?.folder,
      public_id: opts?.publicId,
    }),
  });

  if (!signRes.ok) {
    let errMsg = "Failed to sign upload";
    try {
      const errJson = await signRes.json();
      if (errJson.error) errMsg = errJson.error;
    } catch {
      // ignore parse error
    }
    throw new Error(errMsg);
  }

  const data = await signRes.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", data.apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", data.signature);
  formData.append("folder", data.params.folder);
  if (opts?.publicId) formData.append("public_id", opts.publicId);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`;
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!uploadRes.ok) {
    let errMsg = "Cloudinary upload failed";
    try {
      const errJson = await uploadRes.json();
      if (errJson.error?.message) errMsg = errJson.error.message;
    } catch {
      // ignore parse error
    }
    throw new Error(errMsg);
  }

  return uploadRes.json();
}