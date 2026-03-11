import {
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-rooms')
  @UseInterceptors(FileInterceptor('image'))
  async generateRooms(
    @UploadedFile() file: Express.Multer.File,
    @Body('prompt') prompt: string,
    @Body('colors') colors: string,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Floor plan image is required');
    }
    if (!prompt?.trim()) {
      throw new BadRequestException('Prompt is required');
    }

    let parsedColors: string[] = [];
    if (colors) {
      try {
        parsedColors = JSON.parse(colors);
      } catch {
        // ignore malformed colors
      }
    }

    return this.aiService.generateRooms(file, prompt.trim(), req.user.userId, parsedColors);
  }

  @Get('history')
  async getHistory(@Req() req: any) {
    return this.aiService.getHistory(req.user.userId);
  }
}
