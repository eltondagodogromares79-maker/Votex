/**
 * API proxy route — forwards all /api/v1/* requests to the Rust backend.
 *
 * Why this exists instead of next.config.ts rewrites:
 * Next.js rewrites() strip the Authorization header when forwarding to
 * external origins. This route handler explicitly forwards all headers
 * (including Authorization: Bearer <token>) so the backend JWT middleware
 * can authenticate the request.
 *
 * Supported methods: GET, POST, PUT, PATCH, DELETE
 */

import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const backendPath = `/api/v1/${path.join("/")}`;

  // Preserve query string
  const search = request.nextUrl.search;
  const url = `${BACKEND_URL}${backendPath}${search}`;

  // Forward all headers from the client, including Authorization
  const forwardedHeaders = new Headers(request.headers);

  // Remove Next.js-specific headers that shouldn't reach the backend
  forwardedHeaders.delete("host");

  const body =
    request.method !== "GET" && request.method !== "HEAD"
      ? await request.arrayBuffer()
      : undefined;

  const backendResponse = await fetch(url, {
    method: request.method,
    headers: forwardedHeaders,
    body: body,
    // Forward credentials (cookies) to the backend
    credentials: "include",
    // Don't follow redirects — let the client handle them
    redirect: "manual",
  });

  // Forward the response back to the client, including Set-Cookie headers
  const responseHeaders = new Headers(backendResponse.headers);

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
