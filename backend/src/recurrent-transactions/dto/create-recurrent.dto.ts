import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateRecurrentDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Contoh: "Netflix"

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType; // Pakai enum INCOME/EXPENSE yang ada di schema kamu

  @IsString()
  @IsNotEmpty()
  categoryId: string; // Contoh: "Entertainment"

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  frequency: string; // "MONTHLY" atau "WEEKLY"

  @IsString()
  @IsNotEmpty()
  nextRunDate: string; // Tanggal mulai tagihan (ISOString)
}