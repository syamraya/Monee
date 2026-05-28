import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama kategori tidak boleh kosong, bre!' })
  @MinLength(3, { message: 'Nama kategori minimal 3 karakter!' })
  name: string;

  
  @IsEnum(TransactionType, { message: 'Type harus diisi INCOME atau EXPENSE!' })
  @IsNotEmpty({ message: 'Tipe kategori (type) wajib ditentukan, bre!' })
  type: TransactionType; 
}