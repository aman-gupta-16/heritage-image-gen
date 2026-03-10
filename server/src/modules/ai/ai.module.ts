import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';
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
  providers: [AiService],
})
export class AiModule {}
