import { getCookie, setCookie } from "vinxi/http";
import crypto from "node:crypto";

const GUEST_SESSION_COOKIE = "hr_shoes_guest_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Retrieves the current guest session token from cookies.
 * If none exists, generates a new UUID, sets the cookie, and returns it.
 * MUST be called within a server context (e.g. createServerFn).
 */
export function getOrCreateGuestSession(): string {
  let session = getCookie(GUEST_SESSION_COOKIE);
  if (!session) {
    session = crypto.randomUUID();
    setCookie(GUEST_SESSION_COOKIE, session, {
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }
  return session;
}

/**
 * Retrieves the current guest session token if it exists.
 */
export function getGuestSession(): string | null {
  return getCookie(GUEST_SESSION_COOKIE) || null;
}

const SELLER_REF_COOKIE = "hr_shoes_seller_ref";

export function setSellerRefCookie(sellerId: string): void {
  setCookie(SELLER_REF_COOKIE, sellerId, {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export function getSellerRefCookie(): string | null {
  return getCookie(SELLER_REF_COOKIE) || null;
}
