import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION =
  'You are an architectural visualization model that converts a 2D floor plan into empty interior room images. ' +
  'Rooms must contain no furniture. Only walls, windows, doors, floor, and ceiling. ' +
  'For each room identified in the floor plan, generate a photorealistic interior image and label it with the room name.';

@Injectable()
export class GeminiProvider {
  private readonly genai: GoogleGenAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genai = new GoogleGenAI({ apiKey });
    }
  }

  async generate(prompt: string, imageBase64: string, mimeType: string) {
    return await this.genai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
  }
}
