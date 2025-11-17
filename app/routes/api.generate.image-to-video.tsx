import type { ActionFunctionArgs } from "react-router";
import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { imageUrl, prompt, model = "minimax", duration = 5 } = body;

    if (!imageUrl) {
      return Response.json({ error: "Image URL is required" }, { status: 400 });
    }

    const modelMap: Record<string, string> = {
      minimax: "fal-ai/minimax-video/image-to-video",
      kling: "fal-ai/kling-video/v1/standard/image-to-video",
    };

    const endpoint = modelMap[model] || "fal-ai/minimax-video/image-to-video";

    const result = await fal.subscribe(endpoint, {
      input: {
        image_url: imageUrl,
        prompt: prompt || "",
        duration: duration,
      },
      logs: true,
    });

    const videoUrl = (result as any).video?.url;

    if (!videoUrl) {
      return Response.json({ error: "No video URL in response" }, { status: 500 });
    }

    return Response.json({ success: true, videoUrl });
  } catch (error: any) {
    console.error("Image-to-video error:", error);
    return Response.json(
      { error: error.message || "Video generation failed" },
      { status: 500 }
    );
  }
}
