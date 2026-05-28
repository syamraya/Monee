import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateSavingGoalDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  targetAmount: number;
  
  @IsOptional()
  @IsString()
  category?: string ;

  @IsOptional()
  @IsDateString()
  deadline?: Date;
}


export class AddDepositDto {
  @IsNumber()
  @Min(1)
  amount: number;
}