import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dynamic } from './dynamic.entity';
import { DynamicService } from './dynamic.service';

@Module({
  providers: [DynamicService],
  imports: [TypeOrmModule.forFeature([Dynamic])],
  exports: [DynamicService],
})
export class DynamicModule {}
