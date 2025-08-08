/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/app/api/cloudinary-sign/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { timestamp, folder, public_id } = await req.json();

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;

    if (!apiSecret || !cloudName || !apiKey) {
      return NextResponse.json(
        { error: "Cloudinary not configured" },
        { status: 500 }
      );
    }

    const paramsToSign: Record<string, string | number> = {
      timestamp,
      folder: folder ?? process.env.CLOUDINARY_UPLOAD_FOLDER ?? "accounting",
      ...(public_id ? { public_id } : {}),
    };

    const sorted = Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join("&");

    const signature = crypto
      .createHash("sha1")
      .update(sorted + apiSecret)
      .digest("hex");

    return NextResponse.json({
      cloudName,
      apiKey,
      signature,
      params: paramsToSign,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 400 }
    );
  }
}