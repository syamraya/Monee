import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Prisma, TransactionType } from '@prisma/client'; 

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Kategori sudah terdaftar');

    return this.prisma.category.create({ data: dto });
  }


  async findAll(type?: TransactionType) {
    return this.prisma.category.findMany({
      where: type ? { type } : {}, 
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id); 
    return this.prisma.category.update({
      where: { id },
      data: dto
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    
    try {
      await this.prisma.category.delete({ where: { id } });
      return { message: 'Kategori berhasil dihapus, bre!' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Kategori gagal dihapus karena masih digunakan dalam data transaksi atau target tabungan!',
          );
        }
      }
      throw error;
    }
  }

  private async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Kategori tidak ditemukan');
    return category;
  }
}