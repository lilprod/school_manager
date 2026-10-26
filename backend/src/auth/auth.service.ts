import { randomBytes, createHash } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from './types/authenticated-user.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const REFRESH_TOKEN_BYTES = 48;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Identifiants invalides.');
    }
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Identifiants invalides.');
    }
    return { id: user.id, email: user.email, role: user.role, schoolId: user.schoolId };
  }

  async login(user: AuthenticatedUser): Promise<TokenPair> {
    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user.id);
    await this.recordAudit(user.id, 'LOGIN', 'User', user.id);
    return { accessToken, refreshToken };
  }

  async refresh(rawRefreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revoked: false },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new UnauthorizedException('Session expirée, veuillez vous reconnecter.');
    }

    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    const user: AuthenticatedUser = {
      id: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
      schoolId: stored.user.schoolId,
    };
    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user.id);
    return { accessToken, refreshToken };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revoked: false },
      data: { revoked: true },
    });
  }

  private signAccessToken(user: AuthenticatedUser): string {
    const payload = { sub: user.id, email: user.email, role: user.role, schoolId: user.schoolId };
    const expiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: expiresIn as unknown as number,
    });
  }

  private async issueRefreshToken(userId: string): Promise<string> {
    const rawToken = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresInDays = this.parseExpiresInDays(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    );
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return rawToken;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiresInDays(value: string): number {
    const match = /^(\d+)d$/.exec(value);
    return match ? Number(match[1]) : 7;
  }

  private async recordAudit(userId: string, action: string, entity: string, entityId?: string) {
    await this.prisma.auditLog.create({
      data: { userId, action, entity, entityId },
    });
  }
}
