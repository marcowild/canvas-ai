import type { RouteConfig } from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("workflow/:id", "routes/workflow.$id.tsx"),
  route("templates", "routes/templates.tsx"),

  // API Routes
  route("api/generate/text-to-image", "routes/api.generate.text-to-image.tsx"),
  route("api/generate/image-to-video", "routes/api.generate.image-to-video.tsx"),
  route("api/generate/text-to-video", "routes/api.generate.text-to-video.tsx"),
] satisfies RouteConfig;
