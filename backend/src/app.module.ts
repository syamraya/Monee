// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CategoriesModule } from './categories/categories.module';
import { MarketModule } from './market/market.module';
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsModule } from './analytics/analytics.module';
import { SavingGoalsModule } from './saving-goals/saving-goals.module';
import { RecurrentTransactionsModule } from './recurrent-transactions/recurrent-transactions.module';
import { MailModule } from './mail/mail.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Ini harus paling atas!
    PrismaModule,
    UsersModule,
    AuthModule,
    TransactionsModule,
    CategoriesModule,
    MarketModule,
    AnalyticsModule,
    SavingGoalsModule,
    RecurrentTransactionsModule,
    MailModule,
    
    
  ],
})
export class AppModule {}