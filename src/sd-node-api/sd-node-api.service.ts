import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sdwebui, { Client, SamplingMethod } from 'node-sd-webui'

@Injectable()
export class SDNodeApiService {
  private readonly logger = new Logger(SDNodeApiService.name);
  client: Client;

  constructor(
    private configService: ConfigService,
  ) {
    this.client = sdwebui({
      apiUrl: this.configService.get('SD_API_URL'),
    })
  }

  generateImage = async (prompt: string) => {
    const { images, parameters, info } = await this.client.txt2img({
      prompt,
      negativePrompt: '(deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation',
      samplingMethod: SamplingMethod.DPMPlusPlus_2M_Karras,
      width: 512,
      height: 512,
      steps: 20,
      batchSize: 1,
    })

    return Buffer.from(images[0], 'base64');
  }

  generateImageFull = async (prompt: string, seed: number) => {
    const { images, parameters, info } = await this.client.txt2img({
      prompt,
      negativePrompt: '(deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation',
      samplingMethod: SamplingMethod.DPMPlusPlus_2M_Karras,
      width: 512,
      height: 512,
      steps: 25,
      batchSize: 1,
      cfgScale: 7,
      seed
    })

    return Buffer.from(images[0], 'base64');
  }

  generateImagesPreviews = async (prompt: string) => {
    const res = await this.client.txt2img({
      prompt,
      negativePrompt: '(deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation',
      samplingMethod: SamplingMethod.DPMPlusPlus_2M_Karras,
      width: 512,
      height: 512,
      steps: 15,
      batchSize: 4,
      cfgScale: 10,
    })

    return res;
  }
}