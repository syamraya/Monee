import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Format email tidak valid!' })
  @IsNotEmpty()
  email: string;
  
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword(
    { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 },
    { message: 'Password harus minimal 6 karakter, mengandung huruf besar, huruf kecil, dan angka' },
  )
  @MinLength(6,  { message: 'Password minimal 6 karakter' })
  password: string;
  
  @IsString()
  @IsNotEmpty()
  name: string;
}