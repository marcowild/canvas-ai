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
    const { imageUrl, prompt, model = "minimax", duration = "5s", aspectRatio = "auto" } = body;

    if (!imageUrl) {
      return Response.json({ error: "Image URL is required" }, { status: 400 });
    }

    const modelMap: Record<string, string> = {
      minimax: "fal-ai/minimax-video/image-to-video",
      kling: "fal-ai/kling-video/v1/standard/image-to-video",
      "veo-3": "fal-ai/veo3.1/fast/image-to-video",
    };

    const endpoint = modelMap[model] || "fal-ai/minimax-video/image-to-video";

    // Build input based on model
    let input: any;
    if (model === "veo-3") {
      input = {
        prompt: prompt || "",
        image_url: imageUrl,
        duration,
      };

      // Only add aspect_ratio if it's not "auto" (auto means use image's aspect ratio)
      if (aspectRatio && aspectRatio !== "auto") {
        input.aspect_ratio = aspectRatio;
      }

      console.log(input)
    } else {
      // For other models, convert duration string to number
      const durationNum = parseInt(duration);
      input = {
        image_url: imageUrl,
        prompt: prompt || "",
        duration: durationNum,
      };
    }

    const result = await fal.subscribe(endpoint, {
      input,
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
