import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryHelper } from './cloudinary.helper';

@Injectable()
export class PollinationsProvider {
  constructor(
    private readonly config: ConfigService,
    private readonly cloudinary: CloudinaryHelper,
  ) {}

  async generate(prompt: string, imageBase64: string, mimeType: string) {
    const apiKey = this.config.get<string>('POLLEN_API_KEY');

    const imageUrl = await this.cloudinary.upload(imageBase64, mimeType, 'floor-plans');

    const url = new URL(
      'https://gen.pollinations.ai/image/' + encodeURIComponent(prompt),
    );
    url.searchParams.set('model', 'flux-2-dev');
    url.searchParams.set('width', '1024');
    url.searchParams.set('height', '1024');
    url.searchParams.set('seed', '0');
    url.searchParams.set('enhance', 'false');
    url.searchParams.set('nologo', 'true');
    url.searchParams.set('image', imageUrl);
    if (apiKey) {
      url.searchParams.set('key', apiKey);
    }

    const finalUrl = url.toString();
    console.log('Pollinations URL length:', finalUrl.length);
    console.log('Pollinations image URL:', imageUrl);

    const res = await fetch(finalUrl);

    if (!res.ok) {
      const body = await res.text();
      console.error('Pollinations error:', res.status, res.statusText, body);
      throw new Error(`Pollinations request failed: ${res.status} ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    return {
      candidates: [
        {
          content: {
            parts: [
              { text: 'Generated Room' },
              {
                inlineData: {
                  data: base64Image,
                  mimeType: 'image/png',
                },
              },
            ],
          },
        },
      ],
    };
  }
}
