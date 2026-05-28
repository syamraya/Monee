import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRecurrentDto } from './dto/create-recurrent.dto';

@Injectable()
export class RecurrentTransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateRecurrentDto) {
    return this.prisma.recurrentTransaction.create({
      data: {
        ...dto,
        userId,
        nextRunDate: new Date(dto.nextRunDate),
        isActive: true,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.recurrentTransaction.findMany({
      where: { userId },
    });
  }

  // Kamu bisa tambahkan fungsi delete kalau user mau stop langganan
  async remove(id: string, userId: string) {
    return this.prisma.recurrentTransaction.deleteMany({
      where: { id, userId },
    });
  }
}