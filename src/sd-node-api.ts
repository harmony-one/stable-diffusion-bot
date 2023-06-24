import sdwebui, { SamplingMethod } from 'node-sd-webui'
import { writeFileSync } from 'fs'

const client = sdwebui({
    apiUrl: process.env.SD_API_URL
})

export const generateImage = async (prompt: string) => {
    const { images } = await client.txt2img({
        prompt,
        negativePrompt: 'blurry, cartoon, drawing, illustration',
        samplingMethod: SamplingMethod.Euler_A,
        width: 512,
        height: 512,
        steps: 20,
        batchSize: 1,
    })

    return Buffer.from(images[0], 'base64');
}