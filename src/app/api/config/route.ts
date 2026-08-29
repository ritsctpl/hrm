import { NextResponse } from 'next/server';

// Inside a session preview the platform sets BE_PREVIEW_ORIGIN. Serving a *relative*
// API base then routes every call through the rewrite in next.config.mjs, which reaches
// this worktree's own backend — same-origin, so no CORS, and multipart bodies survive.
const sessionApiBase = process.env.BE_PREVIEW_ORIGIN ? '/hrm/session-api' : undefined;

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_HOST: process.env.NEXT_PUBLIC_HOST || "192.168.147.129",
    NEXT_PUBLIC_KEYCLOAK_PORT: process.env.NEXT_PUBLIC_KEYCLOAK_PORT || "8181",
    NEXT_PUBLIC_REDIRECT_PORT: process.env.NEXT_PUBLIC_REDIRECT_PORT || "8687",
    NEXT_PUBLIC_API_PORT: process.env.NEXT_PUBLIC_API_PORT || "8080",
    NEXT_PUBLIC_KEYCLOAK_REALM: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "spring-boot-microservices-realm",
    NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "rmfg-init-client",
    NEXT_PUBLIC_KEYCLOAK_URL: process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://192.168.147.129:8181",
    NEXT_PUBLIC_REDIRECT_URI: process.env.NEXT_PUBLIC_REDIRECT_URI || "http://192.168.147.129:8687/hrm",
    NEXT_PUBLIC_API_BASE_URL:
      sessionApiBase || process.env.NEXT_PUBLIC_API_BASE_URL || "http://192.168.147.129:8080/app/v1",
  });
}

export const dynamic = 'force-dynamic';
