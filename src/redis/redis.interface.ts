import { ModuleMetadata } from '@nestjs/common/interfaces';
import { ClientOpts, RedisClient } from 'redis';

export interface RedisModuleOptions extends ClientOpts {
  name?: string;
  url?: string;
  onClientReady?(client: RedisClient): void;
}

export interface RedisModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (
    ...args: any[]
  ) =>
    | RedisModuleOptions
    | RedisModuleOptions[]
    | Promise<RedisModuleOptions>
    | Promise<RedisModuleOptions[]>;
  inject?: any[];
}
