import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavingTasksService {
  private readonly logger = new Logger(SavingTasksService.name);

  constructor(private prisma: PrismaService) {}
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleSavingAutodebet() {
    this.logger.log('Menjalankan Autodebet Tabungan...');

    const goals = await this.prisma.savingGoal.findMany({
      where: { isRecurrent: true },
      include: { user: true }
    });

    for (const goal of goals) {
      if (goal.user.balance >= goal.recurrentAmount) {
        await this.prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: goal.userId },
            data: { balance: { decrement: goal.recurrentAmount } }
          });
          await tx.savingGoal.update({
            where: { id: goal.id },
            data: { currentAmount: { increment: goal.recurrentAmount } }
          });
        });
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) 
  async handleRecurringExpenses() {
    this.logger.log('Mengecek Tagihan Rutin...');
    const today = new Date();

    const subs = await this.prisma.recurrentTransaction.findMany({
      where: { 
        isActive: true,
        nextRunDate: { lte: today } 
      },
      include: { user: true }
    });

  for (const sub of subs) {
  const currentUser = await this.prisma.user.findUnique({ where: { id: sub.userId } });

  if (currentUser && currentUser.balance >= sub.amount) {
    await this.prisma.$transaction(async (tx) => {
      const balanceBefore = currentUser.balance;
      const balanceAfter = balanceBefore - sub.amount;

      await tx.user.update({
        where: { id: sub.userId },
        data: { balance: balanceAfter }
      });

      await tx.transaction.create({
        data: {
          amount: sub.amount,
          type: 'EXPENSE',
          description: `[Otomatis] ${sub.name}`,
          userId: sub.userId,
          categoryId: sub.categoryId, 
          balanceBefore,
          balanceAfter
        }
      });

      const nextDate = new Date(sub.nextRunDate);
      nextDate.setMonth(nextDate.getMonth() + 1);

      await tx.recurrentTransaction.update({
        where: { id: sub.id },
        data: { nextRunDate: nextDate }
      });
    });
    
    this.logger.log(`Robot Berhasil Bayar: ${sub.name}`);
  } else {
    this.logger.warn(`Robot Gagal: Saldo ${currentUser?.email} tidak cukup untuk ${sub.name}`);
  }
}
  }
}