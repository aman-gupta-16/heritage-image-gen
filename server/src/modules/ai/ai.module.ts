import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';
import { CloudinaryHelper } from './cloudinary.helper.js';
import { GeminiProvider } from './gemini.provider.js';
import { PollinationsProvider } from './pollinations.provider.js';
import {
  Generation,
  GenerationSchema,
} from './schemas/generation.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Generation.name, schema: GenerationSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService, CloudinaryHelper, GeminiProvider, PollinationsProvider],
})
export class AiModule {}
