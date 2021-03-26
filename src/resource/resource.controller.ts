import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourceService } from './resource.service';

@Controller('/api/resource')
@UseGuards(AuthGuard('jwt'))
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const { buffer, originalname: originalName } = file;
    return await this.resourceService.uploadImage(buffer, originalName);
  }
}
