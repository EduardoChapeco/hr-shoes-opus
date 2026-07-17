import { createStart, createMiddleware } from "@tanstack/react-start";
import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next, handlerType }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    if (
      error != null &&
      typeof error === "object" &&
      ("isRedirect" in error || "isNotFound" in error || "statusCode" in error)
    ) {
      throw error;
    }
    console.error(error);

    // Do not return HTML for server functions
    if (handlerType === "serverFn") {
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));
