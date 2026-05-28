import { 
  Controller, Get, Patch, Param, Body, UseGuards, Req, 
  UseInterceptors, UploadedFile, InternalServerErrorException 
} from '@nestjs/common';
import { UserService } from './users.service';
import { FilesService } from '../files/files.service'; 
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express'; 
import { Role } from '@prisma/client';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly filesService: FilesService, 
  ) {}

  @Patch('avatar')
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('file'))
async uploadAvatar(
  @UploadedFile() file: Express.Multer.File,
  @Req() req: any,
) {
  if (!req.user || !req.user.userId) {
    throw new Error('User tidak ditemukan dalam request, bre!');
  }

  const userId = req.user.userId; 

  try {
    const avatarUrl = await this.filesService.uploadPublicFile(file, 'avatars'); 
    return await this.userService.updateAvatar(userId, avatarUrl);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Gagal upload avatar:', errorMessage);
    throw new InternalServerErrorException(errorMessage);
  }
}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req) {
    return this.userService.findOne(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-profile')
  async update(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(req.user.userId, updateUserDto);
  }

  @Patch(':id/set-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) 
  async makeAdmin(@Param('id') id: string) {
    return this.userService.updateRole(id, Role.ADMIN);
  }
}