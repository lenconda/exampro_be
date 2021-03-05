import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import apprc from '../../.apprc';

@Injectable()
export class ConfigService {
  constructor() {
    this.config = apprc;
  }

  private config: Record<string, any> = {};

  public get(path?: string): Record<string, any> {
    if (!path) {
      return this.config;
    }
    return _.get(this.config, path) || {};
  }
}
