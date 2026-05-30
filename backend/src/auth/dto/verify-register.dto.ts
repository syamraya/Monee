import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class VerifyRegisterDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP wajib diisi, bre!' })
  otp: string;

  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string; 
  @IsString()
  @IsNotEmpty()
  name: string;
}