import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  serverBuildFile: "index.js",
  async prerender() {
    // Disable prerendering if Basic Auth is enabled
    // since authenticated routes can't be statically rendered
    if (process.env.BASIC_AUTH_USERNAME && process.env.BASIC_AUTH_PASSWORD) {
      return [];
    }
    return ["/"];
  },
} satisfies Config;
