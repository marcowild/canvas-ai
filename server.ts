import "dotenv/config";
import { createRequestHandler } from "@react-router/express";
import express from "express";
import basicAuth from "basic-auth";

const app = express();
const PORT = process.env.PORT || 5173;

// Basic Auth middleware (if configured)
const basicAuthUsername = process.env.BASIC_AUTH_USERNAME;
const basicAuthPassword = process.env.BASIC_AUTH_PASSWORD;

if (basicAuthUsername && basicAuthPassword) {
  console.log("Basic authentication enabled");
  app.use((req, res, next) => {
    const credentials = basicAuth(req);
    if (
      !credentials ||
      credentials.name !== basicAuthUsername ||
      credentials.pass !== basicAuthPassword
    ) {
      res.set("WWW-Authenticate", 'Basic realm="CanvasAI"');
      return res.status(401).send("Authentication required");
    }
    next();
  });
}

// Vite dev server in development
const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  // Production: serve static assets
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
  app.use(express.static("build/client", { maxAge: "1h" }));
}

// React Router request handler
app.all(
  "*",
  createRequestHandler({
    build: viteDevServer
      ? () => viteDevServer.ssrLoadModule("virtual:react-router/server-build")
      : await import("./build/server/index.js"),
  })
);

app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
