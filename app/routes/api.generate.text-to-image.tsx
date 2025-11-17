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
    const { prompt, model = "flux-pro", width = 1024, height = 1024, steps = 30 } = body;

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const modelMap: Record<string, string> = {
      "flux-pro": "fal-ai/flux-pro",
      sdxl: "fal-ai/fast-sdxl",
      "sd-3.5": "fal-ai/stable-diffusion-v3-medium",
    };

    const endpoint = modelMap[model] || "fal-ai/flux-pro";

    const result = await fal.subscribe(endpoint, {
      input: {
        prompt,
        image_size: { width, height },
        num_inference_steps: steps,
      },
      logs: true,
    });

    const imageUrl = (result as any).images?.[0]?.url || (result as any).image?.url;

    if (!imageUrl) {
      return Response.json({ error: "No image URL in response" }, { status: 500 });
    }

    return Response.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error("Text-to-image error:", error);
    return Response.json(
      { error: error.message || "Image generation failed" },
      { status: 500 }
    );
  }
}
