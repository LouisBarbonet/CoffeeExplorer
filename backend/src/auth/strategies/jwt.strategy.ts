import {Injectable, UnauthorizedException} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import {Request} from "express";
import { Strategy } from "passport-jwt";

export interface AccessTokenPayload {
    sub: string;
    email: string;
}

export interface AuthenticatedUser {
    id: string;
    email: string;
}

function extractAccessTokenFromCookie(req: Request): string | null {
    const value: unknown = req?.cookies?.['access-token'];
    return typeof value === "string" ? value : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: extractAccessTokenFromCookie,
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
        })
    }

    validate(payload: AccessTokenPayload): AuthenticatedUser {
        if (!payload?.sub || !payload?.email) {
            throw new UnauthorizedException();
        }

        return {id: payload.sub, email: payload.email};
    }
}