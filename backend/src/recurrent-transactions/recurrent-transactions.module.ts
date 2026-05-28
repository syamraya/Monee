import { Module } from '@nestjs/common';
import { RecurrentTransactionsService } from './recurrent-transactions.service';
import { RecurrentTransactionsController } from './recurrent-transactions.controller';
import { PrismaModule } from 'src/prisma/prisma.module'; 

@Module({
  imports: [PrismaModule], 
  controllers: [RecurrentTransactionsController],
  providers: [RecurrentTransactionsService],
  exports: [RecurrentTransactionsService], 
})
export class RecurrentTransactionsModule {}