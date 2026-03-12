import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  Generation,
  GenerationDocument,
} from './schemas/generation.schema';
import { CloudinaryHelper } from './cloudinary.helper';
import { GeminiProvider } from './gemini.provider';
import { PollinationsProvider } from './pollinations.provider';
import { parseAiResponse } from './response-parser.util';

@Injectable()
export class AiService {
  private readonly provider: 'GEMINI' | 'POLLINATIONS';

  constructor(
    @InjectModel(Generation.name)
    private readonly generationModel: Model<GenerationDocument>,
    private readonly config: ConfigService,
    private readonly cloudinary: CloudinaryHelper,
    private readonly gemini: GeminiProvider,
    private readonly pollinations: PollinationsProvider,
  ) {
    this.provider =
      (this.config.get<string>('AI_PROVIDER') as 'GEMINI' | 'POLLINATIONS') ||
      'POLLINATIONS';
  }

  async generateRooms(file: Express.Multer.File, prompt: string, userId: string, colors: string[] = []) {
    const imageBase64 = file.buffer.toString('base64');
    const mimeType = file.mimetype;

    const originalImageUrl = await this.cloudinary.upload(imageBase64, mimeType, 'floor-plans');

    let enrichedPrompt = prompt;
    if (colors.length > 0) {
      enrichedPrompt += ` Use the following color palette: ${colors.join(', ')}.`;
    }

    let response;

    try {
      if (this.provider === 'GEMINI') {
        response = await this.gemini.generate(enrichedPrompt, imageBase64, mimeType);
      } else {
        response = await this.pollinations.generate(enrichedPrompt, imageBase64, mimeType);
      }
    } catch (err) {
      console.error('AI API error:', err);
      throw new InternalServerErrorException(
        'Failed to generate rooms from AI provider',
      );
    }

    const parsedRooms = parseAiResponse(response);

    const generatedRooms = await Promise.all(
      parsedRooms.map(async (room) => ({
        roomName: room.roomName,
        imageUrl: await this.cloudinary.upload(room.imageBase64, 'image/png', 'generated-rooms'),
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
}