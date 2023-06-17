import fetch from 'node-fetch'
import fs from 'node:fs'

const engineId = 'stable-diffusion-v1-5'
const apiHost = process.env.API_HOST ?? 'https://api.stability.ai'

const apiKey = process.env.STABILITY_API_KEY;

if (!apiKey) throw new Error('Missing Stability API key.')

interface GenerationResponse {
    artifacts: Array<{
      base64: string
      seed: number
      finishReason: string
    }>
}

export const generateImage = async (prompt: string) => {
    const response = await fetch(
        `${apiHost}/v1/generation/${engineId}/text-to-image`,
        {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
            text_prompts: prompt.split(',').map(p => ({ text: prompt })),
            // style_preset: 'anime',
            cfg_scale: 7,
            clip_guidance_preset: 'FAST_BLUE',
            height: 512,
            width: 512,
            samples: 1,
            steps: 25,
            }),
        }
    )

    if (!response.ok) {
        throw new Error(`Non-200 response: ${await response.text()}`)
    }

    const responseJSON = (await response.json()) as GenerationResponse

    // console.log(111, responseJSON.artifacts[0]);

    return Buffer.from(responseJSON.artifacts[0].base64, 'base64');
}
