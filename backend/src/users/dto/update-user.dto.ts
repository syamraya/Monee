import { IsEmail, IsString, IsNumber, Min, IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  oldPassword?: string; // 🔥 Tambahkan ini untuk verifikasi password lama

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password baru minimal 6 karakter' })
  password?: string; // Ini akan dianggap sebagai password baru

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Saldo tidak boleh negatif' })
  balance?: number; 
}