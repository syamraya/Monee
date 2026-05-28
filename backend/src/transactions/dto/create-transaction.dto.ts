import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @Min(100) 
  amount: number;

  @IsEnum(['INCOME', 'EXPENSE'], { message: 'Type harus INCOME atau EXPENSE' })
  type: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;
}