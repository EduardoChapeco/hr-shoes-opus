import { describe, expect, it } from "vitest";

import {
  appendResponseCookie,
  readAllCookiesFromRequest,
  readCookieFromRequest,
} from "./http-cookies";

describe("HTTP cookie helpers", () => {
  it("reads encoded cookies without corrupting equals signs", () => {
    const request = new Request("https://hrshoes.example/", {
      headers: { cookie: "plain=value; encoded=a%3Db%3D; empty=" },
    });

    expect(readCookieFromRequest(request, "encoded")).toBe("a=b=");
    expect(readCookieFromRequest(request, "missing")).toBeNull();
    expect(readAllCookiesFromRequest(request)).toEqual([
      { name: "plain", value: "value" },
      { name: "encoded", value: "a=b=" },
      { name: "empty", value: "" },
    ]);
  });

  it("serializes cookie security attributes through the maintained Supabase serializer", () => {
    const headers = new Headers();

    appendResponseCookie(headers, "session", "a=b", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
    });

    expect(headers.get("set-cookie")).toBe("session=a%3Db; Path=/; HttpOnly; Secure; SameSite=Lax");
  });
});
