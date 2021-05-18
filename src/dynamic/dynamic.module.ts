import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dynamic } from './dynamic.entity';
import { DynamicService } from './dynamic.service';
import { DynamicController } from './dynamic.controller';

@Module({
  providers: [DynamicService],
  imports: [TypeOrmModule.forFeature([Dynamic])],
  exports: [DynamicService],
  controllers: [DynamicController],
})
export class DynamicModule {}
