import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const UPLOAD_FOLDERS: Record<string, string> = {
  "profile-images": "votex/profile-images",
  "organization-logos": "votex/organization-logos",
  "pageant-images": "votex/pageant-images",
  "contestant-photos": "votex/contestant-photos",
  "subscription-payment-proofs": "votex/subscription-payment-proofs",
};

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Authentication is required." }, { status: 401 });
  }

  let requestedFolder = "subscription-payment-proofs";
  try {
    const body = await request.json();
    if (typeof body.folder === "string") requestedFolder = body.folder;
  } catch {
    // Keep the subscription proof folder as the default for existing callers.
  }
  const folder = UPLOAD_FOLDERS[requestedFolder];
  if (!folder) return NextResponse.json({ message: "Unsupported upload folder." }, { status: 400 });

  try {
    const authCheck = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      headers: { Authorization: authorization },
      cache: "no-store",
    });
    if (!authCheck.ok) {
      return NextResponse.json({ message: "Your session is not valid." }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ message: "Could not validate your session." }, { status: 503 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ message: "Cloudinary is not configured on the server." }, { status: 503 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    folder,
    signature,
  });
}
