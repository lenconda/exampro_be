import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import { v4 } from 'uuid';
import OSS, { Options } from 'ali-oss';
import { ConfigService } from 'src/config/config.service';

@Injectable()
export class ResourceService {
  constructor(private readonly configService: ConfigService) {
    this.oss = new OSS({
      ...(configService.get('oss') as Options),
      secure: true,
    });
  }

  private oss: OSS;

  async uploadImage(buffer: Buffer, originalName: string) {
    const uuid = v4();
    const extension = _.last(originalName.split('.'));
    const filename = `${uuid}.${extension}`;
    const { url } = await this.oss.put(filename, buffer);
    return { url };
  }
}
