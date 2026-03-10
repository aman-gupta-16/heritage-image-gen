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
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Floor plan image is required');
    }
    if (!prompt?.trim()) {
      throw new BadRequestException('Prompt is required');
    }

    return this.aiService.generateRooms(file, prompt.trim(), req.user.userId);
  }

  @Get('history')
  async getHistory(@Req() req: any) {
    return this.aiService.getHistory(req.user.userId);
  }
}
