import { 
  ConflictException, 
  Injectable, 
  InternalServerErrorException, 
  BadRequestException, 
  NotFoundException, 
  UnauthorizedException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto'; 
import { VerifyRegisterDto } from './dto/verify-register.dto'; 
import { Prisma } from '@prisma/client';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: CreateUserDto) {
  const existingUser = await this.prisma.user.findUnique({
    where: { email: dto.email },
  });

  if (existingUser) {
    throw new ConflictException('Email ini sudah terdaftar, bre!');
  }

  // Generate OTP 6 digit
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);

  // Simpan OTP ke DB
  await this.prisma.passwordReset.create({
    data: {
      email: dto.email,
      otp,
      expiresAt,
    },
  });

  // HTML EMAIL (FIXED - NO MAP, NO COMPLEX TABLE OTP)
  const html = `
    <div style="background:#ffffff; padding:40px 20px; font-family:Arial, sans-serif; max-width:600px; margin:auto;">
      
      <h2 style="color:#111;">Verify your FinTrack account</h2>
      
      <p style="color:#555; font-size:14px;">
        Use the OTP code below to verify your account. This code is valid for 5 minutes.
      </p>

      <div style="
        margin:30px 0;
        text-align:center;
        font-size:36px;
        letter-spacing:10px;
        font-weight:700;
        padding:20px;
        background:#f5f5f5;
        border-radius:10px;
        color:#111;
      ">
        ${otp}
      </div>

      <p style="color:#999; font-size:12px;">
        If you did not request this, ignore this email.
      </p>

    </div>
  `;

  try {
    await this.mailService.sendMail(
      dto.email,
      'Verify your FinTrack Account',
      html,
    );

    return {
      message: 'Verification code sent! Please check your inbox or spam folder.',
    };
  } catch (error) {
    console.error('======= DEBUG SMTP REGISTER ERROR =======');
    console.error(error);
    console.error('=========================================');

    throw new BadRequestException(
      'Failed to send verification email. Please check SMTP configuration.',
    );
  }
}

  async verifyRegister(dto: VerifyRegisterDto) {
    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: { email: dto.email, otp: dto.otp },
      orderBy: { createdAt: 'desc' },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid OTP code. Please try again!');
    }

    const now = new Date();
    if (now > resetRecord.expiresAt) {
      throw new BadRequestException('OTP code has expired. Please register again!');
    }

    try {
      const hashedPassword = await bcrypt.hash(dto.password, 10); 
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          password: hashedPassword,
          role: 'USER', 
        },
      });
      await this.prisma.passwordReset.deleteMany({ where: { email: dto.email } });
      const { password, ...result } = user;
      return {
        message: 'Email verified successfully! Your account is now active. Please login.',
        data: result,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This email is already registered.');
      }
      throw new InternalServerErrorException('Failed to create account. Please try again later.');
    }
  }

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password!');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password!');
    }

    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance
      }
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('Email not found in our system!');
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    await this.prisma.passwordReset.create({
      data: { email: dto.email, otp, expiresAt },
    });

    try {
      await this.mailService.sendMail(
  dto.email,
  'Reset your FinTrack Password',
      `
      <div style="background:#ffffff; padding:40px 20px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px; margin:0 auto; border-collapse:collapse;">
          
          <tr>
            <td style="padding-bottom:32px; border-bottom:1px solid #f2f2f2;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:36px; height:36px; background:#111111; border-radius:8px; text-align:center; font-family:Georgia,serif; font-style:italic; color:#ffffff; font-size:16px; line-height:36px; font-weight:bold;">F</td>
                        <td style="font-family:Georgia,serif; font-style:italic; font-size:18px; color:#111111; padding-left:12px; font-weight:normal; letter-spacing:-0.5px;">FinTrack</td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; font-size:11px; font-weight:600; color:#999999; letter-spacing:1px; text-transform:uppercase;">
                    ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding-top:40px;">
              <p style="font-size:11px; font-weight:700; letter-spacing:1.5px; color:#999999; text-transform:uppercase; margin:0 0 16px;">Password Reset</p>
              <h1 style="font-family:Georgia,serif; font-size:32px; font-weight:400; color:#111111; line-height:1.2; margin:0 0 24px; letter-spacing:-0.5px;">Reset your<br/><span style="font-style:italic;">password.</span></h1>
              <p style="font-size:14px; color:#555555; line-height:1.6; margin:0 0 32px; font-weight:400;">
                Hi <strong style="color:#111111; font-weight:600;">${user.name || 'there'}</strong> — we received a request to reset the password on your FinTrack account. Use the code below to set a new one.
              </p>

              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf9f6; border:1px solid #f0ede6; border-radius:12px; margin-bottom:32px; border-collapse:separate;">
                <tr>
                  <td style="padding:16px 24px; border-bottom:1px solid #f0ede6;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="left" style="font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#999999;">Reset Code</td>
                        <td align="right" style="font-size:12px; color:#d9383a; font-weight:500;">⏱ &nbsp;5 min</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 24px; text-align:center;">
                    <table cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        ${otp.split('').slice(0,3).map(d => `
                          <td style="width:52px; height:64px; background:#ffffff; border:1px solid #e5e5e0; border-radius:10px; text-align:center; font-size:28px; font-weight:500; color:#111111; box-shadow:0 1px 2px rgba(0,0,0,0.02); padding:0;">${d}</td>
                          <td style="width:6px;"></td>
                        `).join('')}
                        <td style="font-size:18px; color:#e5e5e0; padding:0 8px 0 2px; text-align:center;">·</td>
                        ${otp.split('').slice(3,6).map((d, idx) => `
                          <td style="width:52px; height:64px; background:#ffffff; border:1px solid #e5e5e0; border-radius:10px; text-align:center; font-size:28px; font-weight:500; color:#111111; box-shadow:0 1px 2px rgba(0,0,0,0.02); padding:0;">${d}</td>
                          ${idx < 2 ? '<td style="width:6px;"></td>' : ''}
                        `).join('')}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fff5f5; border:1px solid #fcdede; border-radius:10px; margin-bottom:32px; border-collapse:separate;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td valign="top" style="color:#b33939; font-size:14px; width:24px; font-weight:bold; line-height:1.5;">!</td>
                        <td valign="top" style="font-size:13px; color:#b33939; line-height:1.5; font-weight:400;">If you didn't request this, your account is safe — simply ignore this email. Your password won't change unless this code is used.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <hr style="border:none; border-top:1px solid #ededed; margin:0 0 32px;"/>
              <p style="font-size:13px; color:#999999; line-height:1.6; margin:0 0 40px;">
                For your security, this code expires in 5 minutes and is single-use only. Never share this code with anyone. FinTrack support will never ask for it. <a href="https://fintrack.app/security" style="color:#666666; text-decoration:underline;">Learn about account security →</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-top:24px; border-top:1px solid #f2f2f2;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="left" style="font-size:11px; font-weight:600; color:#999999; letter-spacing:1px;">© 2026 FINTRACK</td>
                  <td align="right" style="font-size:12px; color:#999999;">
                    <a href="https://fintrack.app/support" style="color:#999999; text-decoration:none; margin-right:16px;">Support</a>
                    <a href="https://fintrack.app/privacy" style="color:#999999; text-decoration:none; margin-right:16px;">Privacy</a>
                    <a href="https://fintrack.app/unsubscribe" style="color:#999999; text-decoration:none;">Unsubscribe</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </div>  
      `
    );
      return { message: 'OTP code sent successfully! Please check your email.' };
    } catch (error) {
      console.error('======= DEBUG SMTP FORGOT ERROR =======');
      console.error(error);
      console.error('=======================================');
      throw new BadRequestException('Failed to send OTP email. Please check your SMTP configuration.');
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: { email: dto.email, otp: dto.otp },
      orderBy: { createdAt: 'desc' },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid OTP code or email does not match!');
    }

    const now = new Date();
    if (now > resetRecord.expiresAt) {
      throw new BadRequestException('OTP code has expired. Please request a new one!');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { email: dto.email },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordReset.deleteMany({
        where: { email: dto.email },
      }),
    ]);

    return { message: 'Password reset successfully! Please login with your new password.' };
  }
}