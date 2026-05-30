import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Ambil data role apa yang dibutuhkan dari decorator @Roles
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // Jika tidak ada decorator @Roles, berarti semua orang boleh masuk
    if (!requiredRoles) {
      return true;
    }

    // 2. Ambil user dari request (yang sudah dimasukkan oleh JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();
    
    // 3. Cek apakah role user ada di dalam daftar role yang dibutuhkan
    return requiredRoles.some((role) => user.role === role);
  }
}