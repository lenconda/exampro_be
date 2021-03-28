import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from 'src/question/question.entity';
import { Role } from 'src/role/role.entity';
import { RoleModule } from 'src/role/role.module';
import { User } from 'src/user/user.entity';
import { PaperController } from './paper.controller';
import { Paper } from './paper.entity';
import { PaperService } from './paper.service';
import { PaperQuestion } from './paper_question.entity';
import { PaperUser } from './paper_user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Paper,
      PaperQuestion,
      PaperUser,
      User,
      Question,
      Role,
    ]),
    RoleModule,
  ],
  controllers: [PaperController],
  providers: [PaperService],
  exports: [PaperService],
})
export class PaperModule {}
