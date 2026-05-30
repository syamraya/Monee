import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP wajib diisi, bre!' })
  otp: string;

  @IsString()
  @MinLength(6, { message: 'Password baru minimal 6 karakter' })
  newPassword: string;
}