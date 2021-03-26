import { Injectable } from '@nestjs/common';
import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import { v4 } from 'uuid';
import OSS, { Options } from 'ali-oss';
import { ConfigService } from 'src/config/config.service';

@Injectable()
export class ResourceService {
  constructor(private readonly configService: ConfigService) {
    const files = this.configService.get('uploadFiles');
    this.imagesDir =
      _.get(files, 'images') || path.resolve('.exampro/files/images');
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }
    this.oss = new OSS({
      ...(configService.get('oss') as Options),
      secure: true,
    });
  }

  private oss: OSS;

  private imagesDir: string;

  async uploadImage(buffer: Buffer, originalName: string) {
    const uuid = v4();
    const extension = _.last(originalName.split('.'));
    const filename = `${uuid}.${extension}`;
    const { url } = await this.oss.put(filename, buffer);
    return { url };
  }
}
