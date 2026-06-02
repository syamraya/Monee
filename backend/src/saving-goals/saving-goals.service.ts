import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { AddDepositDto, CreateSavingGoalDto } from "./dto/create-saving-goal.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma,TransactionType  } from "@prisma/client";

@Injectable()
export class SavingGoalsService {
  constructor(private prisma: PrismaService) {}

async create(userId: string, dto: CreateSavingGoalDto) {
  try {
    return await this.prisma.savingGoal.create({
      data: {
        ...dto,
        userId,
      },
    });
  } catch (error) {
    // Cek apakah error ini berasal dari Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        throw new UnauthorizedException('User tidak ditemukan di database, silakan login ulang!');
      }
    }
    throw error;
  }
}

async findAll(userId: string) {
  const goals = await this.prisma.savingGoal.findMany({
    where: { userId },
  });

  return goals.map(goal => ({
    ...goal,
    progress: goal.targetAmount > 0 
      ? Math.round((goal.currentAmount / goal.targetAmount) * 100) 
      : 0,
    isReached: goal.currentAmount >= goal.targetAmount
  }));
}
  
async deposit(userId: string, goalId: string, dto: AddDepositDto) {
  const { amount } = dto;
  const goal = await this.prisma.savingGoal.findFirst({
    where: { id: goalId, userId: userId }
  });
  if (!goal) throw new NotFoundException('Target tabungan tidak ditemukan!');

  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.balance < amount) {
    throw new BadRequestException('Saldo kamu tidak cukup, bre!');
  }
  let category = await this.prisma.category.findUnique({ where: { name: 'Tabungan' } });
  if (!category) {
    category = await this.prisma.category.create({ data: { name: 'Tabungan', type: TransactionType.EXPENSE } });
  }

  return this.prisma.$transaction(async (tx) => {
    const balanceBefore = user.balance;
    const balanceAfter = balanceBefore - amount;

    await tx.user.update({
      where: { id: userId },
      data: { balance: balanceAfter }
    });
    const updatedGoal = await tx.savingGoal.update({
      where: { id: goalId },
      data: { currentAmount: { increment: amount } }
    });
    await tx.transaction.create({
      data: {
        amount,
        type: 'EXPENSE',
        description: `Nabung: ${goal.name}`,
        userId,
        categoryId: category.id,
        balanceBefore,
        balanceAfter
      }
    });

    return {
      message: `Berhasil nabung Rp ${amount.toLocaleString()} buat ${goal.name}!`,
      currentBalance: balanceAfter,
      goalDetails: updatedGoal
    };
  });
}
}