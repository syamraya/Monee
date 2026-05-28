import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

    async create(userId: string, dto: CreateTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new BadRequestException('User tidak ditemukan');
      const category = await tx.category.findUnique({
        where: { id: dto.category },
      });
      if (!category) throw new BadRequestException('Kategori tidak valid');
      const balanceBefore = user.balance;
      if (dto.type === 'EXPENSE' && balanceBefore < dto.amount) {
        throw new BadRequestException('Saldo tidak cukup, bre!');
      }

      const adjustment = dto.type === 'INCOME' ? dto.amount : -dto.amount;
      const balanceAfter = balanceBefore + adjustment;

      await tx.user.update({
        where: { id: userId },
        data: { balance: balanceAfter },
      });


      const transaction = await tx.transaction.create({
        data: {
          amount: dto.amount,
          type: dto.type,
          categoryId: dto.category,
          description: dto.description,
          userId,
          balanceBefore,
          balanceAfter,
        },
        include: {
          category: {
            select: { name: true },
          },
        },
      });

      return {
        message: `Transaksi ${dto.type} berhasil dicatat`,
        currentBalance: balanceAfter,
        data: transaction,
      };
    });
  }

  async getStats(userId: string) {
    try {
      const aggregations = await this.prisma.transaction.groupBy({
        by: ['type'],
        where: { userId },
        _sum: {
          amount: true,
        },
      });

      const stats = {
        totalRevenue: 0,
        totalExpenses: 0,
      };

      aggregations.forEach((item) => {
        if (item.type === 'INCOME') {
          stats.totalRevenue = item._sum.amount || 0;
        } else if (item.type === 'EXPENSE') {
          stats.totalExpenses = item._sum.amount || 0;
        }
      });

      return {
        ...stats,
        netProfit: stats.totalRevenue - stats.totalExpenses,
      };
    } catch (error) {
      throw new InternalServerErrorException('Gagal menghitung statistik');
    }
  }

  async findAll(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!transaction) throw new BadRequestException('Transaksi tidak ditemukan');
    return transaction;
  }
}