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
    const { prompt, model = "flux-pro", width = 1024, height = 1024, steps = 30, referenceImage, aspectRatio = "1:1" } = body;

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const modelMap: Record<string, string> = {
      "flux-pro": "fal-ai/flux-pro",
      sdxl: "fal-ai/fast-sdxl",
      "sd-3.5": "fal-ai/stable-diffusion-v3-medium",
      "gemini-2.5-flash": referenceImage ? "fal-ai/gemini-25-flash-image/edit" : "fal-ai/gemini-25-flash-image",
      "nano-banana-pro": referenceImage ? "fal-ai/nano-banana-pro/edit" : "fal-ai/nano-banana-pro",
    };

    const endpoint = modelMap[model] || "fal-ai/flux-pro";

    // Build input object - different models have different parameter formats
    let input: any;

    if (model === "gemini-2.5-flash" || model === "nano-banana-pro") {
      // Gemini and Nano Banana Pro use same API format
      if (referenceImage) {
        // Edit mode with reference image (uses image_urls as array)
        input = {
          prompt,
          image_urls: [referenceImage],
          aspect_ratio: aspectRatio,
        };
      } else {
        // Text-to-image mode
        input = {
          prompt,
          aspect_ratio: aspectRatio,
        };
      }
    } else {
      // Standard format for Flux, SDXL, SD 3.5
      input = {
        prompt,
        image_size: { width, height },
        num_inference_steps: steps,
      };
    }

    // Add reference image if provided (for models that support it)
    // Note: Different models may use different parameter names for reference images
    // Flux Pro uses 'image_url' for img2img
    if (referenceImage) {
      if (model === "flux-pro") {
        input.image_url = referenceImage;
        input.strength = 0.8; // Control how much to transform the reference image
      } else if (model === "sdxl") {
        input.image_url = referenceImage;
        input.strength = 0.8;
      }
      // Other models may not support reference images yet
    }

    const result = await fal.subscribe(endpoint, {
      input,
      logs: true,
    });

    const imageUrl = (result as any).images?.[0]?.url || (result as any).image?.url;

    if (!imageUrl) {
      return Response.json({ error: "No image URL in response" }, { status: 500 });
    }

    return Response.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error("Text-to-image error:", error.body);
    return Response.json(
      { error: error.message || "Image generation failed" },
      { status: 500 }
    );
  }
}
