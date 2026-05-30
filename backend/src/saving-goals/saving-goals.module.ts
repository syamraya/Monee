
import { Module } from '@nestjs/common';
import { SavingGoalsService } from './saving-goals.service';
import { SavingGoalsController } from './saving-goals.controller';
import { PrismaModule } from '../prisma/prisma.module'; 
import { SavingTasksService } from './saving-tasks.service';

@Module({
  imports: [PrismaModule], 
  controllers: [SavingGoalsController],
  providers: [SavingGoalsService, SavingTasksService],
})
export class SavingGoalsModule {}