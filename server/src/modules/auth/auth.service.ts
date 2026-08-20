import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Response } from 'express';
import { User } from '../../database/entities/user.entity';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(RefreshToken) private refreshRepo: Repository<RefreshToken>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto, res: Response) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: {
        userRoles: { role: { rolePermissions: { permission: true } } },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Account is temporarily locked');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }
      await this.userRepo.save(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    const roles = user.userRoles?.map((ur) => ur.role.name) || [];
    const permissions = [
      ...new Set(
        user.userRoles?.flatMap((ur) =>
          ur.role.rolePermissions?.map((rp) => rp.permission.key) || [],
        ) || [],
      ),
    ];

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: this.config.get('jwt.accessExpiry') },
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshRepo.save({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.config.get<boolean>('cookieSecure'),
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        permissions,
      },
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = await this.refreshRepo.findOne({
      where: {
        tokenHash,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: {
        user: { userRoles: { role: { rolePermissions: { permission: true } } } },
      },
    });

    if (!stored) throw new UnauthorizedException('Invalid refresh token');

    const user = stored.user;
    const roles = user.userRoles?.map((ur) => ur.role.name) || [];
    const permissions = [
      ...new Set(
        user.userRoles?.flatMap((ur) =>
          ur.role.rolePermissions?.map((rp) => rp.permission.key) || [],
        ) || [],
      ),
    ];

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: this.config.get('jwt.accessExpiry') },
    );

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        permissions,
      },
    };
  }

  async logout(refreshToken: string | undefined, res: Response) {
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await this.refreshRepo.update({ tokenHash }, { isRevoked: true });
    }
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: this.config.get<boolean>('cookieSecure'),
      sameSite: 'lax',
    });
    return { message: 'Logged out successfully' };
  }
}
