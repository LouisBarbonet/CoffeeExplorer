import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { parseDurationMs } from './duration.util';

export interface AuthTokens {
  accessToken: string;
  accessTokenMaxAgeMs: number;
  refreshToken: string;
  refreshMaxAgesMs: number;
}

export interface AutheticatedUserView {
  id: string;
  email: string;
  name: string | null;
}

interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ user: AutheticatedUserView; tokens: AuthTokens }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    return {
      user: { id: user.id, email: user.email, name: user.name },
      tokens,
    };
  }

  async refresh(refreshTokenRaw: string): Promise<AuthTokens> {
    const payload = this.verifyRefreshToken(refreshTokenRaw);

    const existing = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
    });

    if (!existing || existing.userId !== payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existing.revokedAt || existing.expiresAt < new Date()) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: existing.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token has already been used');
    }

    const tokenMatches = await argon2.verify(
      existing.tokenHash,
      refreshTokenRaw,
    );

    if (!tokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: existing.userId },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(user.id, user.email);
  }

  async logout(refreshTokenRaw: string | undefined): Promise<void> {
    if (!refreshTokenRaw) return;

    let payload: RefreshTokenPayload;
    try {
      payload = this.verifyRefreshToken(refreshTokenRaw);
    } catch {
      return;
    }

    await this.prisma.refreshToken.updateMany({
      where: { id: payload.jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(
    userId: string,
    email: string,
  ): Promise<AuthTokens> {
    const accessExpiresMs = parseDurationMs(
      this.config.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
    );
    const refreshExpiresMs = parseDurationMs(
      this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    );

    const refreshTokenRow = await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: '',
        expiresAt: new Date(Date.now() + refreshExpiresMs),
      },
    });

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, jti: refreshTokenRow.id },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: Math.floor(refreshExpiresMs / 1000),
      },
    );
    const tokenHash = String(await argon2.hash(refreshToken));
    await this.prisma.refreshToken.update({
      where: { id: refreshTokenRow.id },
      data: { tokenHash },
    });

    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: Math.floor(accessExpiresMs / 1000),
      },
    );

    return {
      accessToken,
      accessTokenMaxAgeMs: accessExpiresMs,
      refreshToken,
      refreshMaxAgesMs: refreshExpiresMs,
    };
  }

  private verifyRefreshToken(refreshTokenRaw: string): RefreshTokenPayload {
    try {
      return this.jwt.verify<RefreshTokenPayload>(refreshTokenRaw, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
