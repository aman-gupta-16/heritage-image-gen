import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import {
  Generation,
  GenerationDocument,
} from './schemas/generation.schema';

const SYSTEM_INSTRUCTION =
  'You are an architectural visualization model that converts a 2D floor plan into empty interior room images. ' +
  'Rooms must contain no furniture. Only walls, windows, doors, floor, and ceiling. ' +
  'For each room identified in the floor plan, generate a photorealistic interior image and label it with the room name.';

@Injectable()
export class AiService {
  private readonly genai: GoogleGenAI;
  private readonly provider: 'GEMINI' | 'POLLINATIONS';

  constructor(
    @InjectModel(Generation.name)
    private readonly generationModel: Model<GenerationDocument>,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');

    this.provider =
      (this.config.get<string>('AI_PROVIDER') as 'GEMINI' | 'POLLINATIONS') ||
      'POLLINATIONS';

    if (apiKey) {
      this.genai = new GoogleGenAI({ apiKey });
    }

    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async generateRooms(file: Express.Multer.File, prompt: string, userId: string, colors: string[] = []) {
    const imageBase64 = file.buffer.toString('base64');
    const mimeType = file.mimetype;

    // Upload original floor plan to Cloudinary
    const originalImageUrl = await this.uploadToCloudinary(imageBase64, mimeType, 'floor-plans');

    // Append color preference to prompt if colors are selected
    let enrichedPrompt = prompt;
    if (colors.length > 0) {
      enrichedPrompt += ` Use the following color palette: ${colors.join(', ')}.`;
    }

    let response;

    try {
      if (this.provider === 'GEMINI') {
        response = await this.callGemini(enrichedPrompt, imageBase64, mimeType);
      } else {
        response = await this.callPollinations(enrichedPrompt, imageBase64, mimeType);
      }
    } catch (err) {
      console.error('AI API error:', err);
      throw new InternalServerErrorException(
        'Failed to generate rooms from AI provider',
      );
    }

    const parsedRooms = this.parseResponse(response);

    // Upload each generated room image to Cloudinary
    const generatedRooms = await Promise.all(
      parsedRooms.map(async (room) => ({
        roomName: room.roomName,
        imageUrl: await this.uploadToCloudinary(room.imageBase64, 'image/png', 'generated-rooms'),
      })),
    );

    const doc = await this.generationModel.create({
      userId,
      prompt,
      originalImage: originalImageUrl,
      generatedRooms,
    });

    return {
      generationId: doc._id.toString(),
      prompt: doc.prompt,
      originalImage: originalImageUrl,
      rooms: generatedRooms.map((room) => ({
        roomName: room.roomName,
        imageUrl: room.imageUrl,
      })),
      createdAt: doc.createdAt,
    };
  }

  async getHistory(userId: string) {
    const docs = await this.generationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return docs.map((doc) => ({
      id: doc._id.toString(),
      prompt: doc.prompt,
      originalImage: doc.originalImage,
      rooms: doc.generatedRooms.map((room) => ({
        roomName: room.roomName,
        imageUrl: room.imageUrl,
      })),
      createdAt: doc.createdAt,
    }));
  }

  /* ---------------- GEMINI ---------------- */

  private async callGemini(
    prompt: string,
    imageBase64: string,
    mimeType: string,
  ) {
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

  /* ---------------- POLLINATIONS ---------------- */

  private async uploadToCloudinary(imageBase64: string, mimeType: string, folder: string): Promise<string> {
    const dataUri = `data:${mimeType};base64,${imageBase64}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'image',
    });
    return result.secure_url;
  }

  private async callPollinations(prompt: string, imageBase64: string, mimeType: string) {
    const apiKey = this.config.get<string>('POLLEN_API_KEY');

    const imageUrl = await this.uploadToCloudinary(imageBase64, mimeType, 'floor-plans');

    const url = new URL(
      'https://gen.pollinations.ai/image/' + encodeURIComponent(prompt),
    );
    url.searchParams.set('model', 'flux-2-dev');
    // url.searchParams.set('model', 'klein-large');
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

  /* ---------------- RESPONSE PARSER ---------------- */

  private parseResponse(response: any): {
    roomName: string;
    imageBase64: string;
  }[] {
    const rooms: { roomName: string; imageBase64: string }[] = [];

    const candidates = response?.candidates ?? [];

    let currentLabel = 'Room';

    for (const candidate of candidates) {
      const parts = candidate?.content?.parts ?? [];

      for (const part of parts) {
        if (part.text) {
          const cleaned = part.text.trim().replace(/[:\n]/g, '');
          if (cleaned) {
            currentLabel = cleaned;
          }
        }

        if (part.inlineData?.data) {
          rooms.push({
            roomName: currentLabel || `Room ${rooms.length + 1}`,
            imageBase64: part.inlineData.data,
          });

          currentLabel = `Room ${rooms.length + 1}`;
        }
      }
    }

    return rooms;
  }
}