import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserController } from './users.controller';
import { FilesService } from '../files/files.service';

@Module({
  controllers: [UserController],
  imports: [PrismaModule],
  providers: [UserService, FilesService],
  exports: [UserService],  

})
export class UsersModule {}