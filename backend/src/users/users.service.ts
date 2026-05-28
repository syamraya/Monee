import { BadRequestException, Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service'; 
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt'; 

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private filesService: FilesService, 
  ) {}

  async updateAvatar(userId: string, avatarUrl: string) { 
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl }, 
        select: { id: true, name: true, email: true, avatarUrl: true },
      });
      return {
        message: 'Foto profil berhasil diupdate!',
        data: updatedUser,
      };
    } catch (error: any) {
      this.logger.error(`Gagal update database user ${userId}: ${error.message}`);
      if (error.code === 'P2025') throw new NotFoundException('User tidak ditemukan di database.');
      throw new InternalServerErrorException('Gagal menyimpan URL foto ke database.');
    }
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    
    const { password, ...result } = user;
    return result;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User tidak ditemukan, bre!');

    const updateData: Prisma.UserUpdateInput = {};

    if (dto.name) updateData.name = dto.name;
    if (dto.email) updateData.email = dto.email;
    if (dto.balance !== undefined) updateData.balance = dto.balance; 
    if (dto.password) {
      if (!dto.oldPassword) {
        throw new BadRequestException('Password lama wajib diisi untuk mengganti password baru, bre!');
      }
      const isPasswordMatch = await bcrypt.compare(dto.oldPassword, user.password);
      if (!isPasswordMatch) {
        throw new BadRequestException('Password lama yang kamu masukkan salah!');
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(dto.password, salt);
    }
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, balance: true, avatarUrl: true, role: true }
    });
  }

  async updateRole(id: string, newRole: Role) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User target tidak ada, bre!');

    return this.prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: { id: true, name: true, email: true, role: true }
    });
  }
}