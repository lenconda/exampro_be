import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MenuModule } from 'src/menu/menu.module';
import { RoleModule } from 'src/role/role.module';

@Module({
  imports: [MenuModule, RoleModule],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
