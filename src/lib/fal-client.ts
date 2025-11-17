import * as fal from '@fal-ai/serverless-client'

const falApiKey = import.meta.env.VITE_FAL_API_KEY

if (falApiKey) {
  fal.config({
    credentials: falApiKey,
  })
}

export { fal }
