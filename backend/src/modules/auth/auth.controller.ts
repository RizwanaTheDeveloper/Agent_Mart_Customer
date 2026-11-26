import { Body, Controller, ForbiddenException, Get, Headers, HttpCode, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import type { AuthenticatedRequest, AuthTokens } from '../../common/interfaces/auth.interface.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { AuthService } from './auth.service.js';
import { CurrentUserResponseDto, LoginDto, LogoutResponseDto, RefreshDto, RegisterDto, SessionResponseDto } from './dto/auth.dto.js';

const cookieName = 'agentmart_refresh';

@ApiTags('authentication')
@ApiHeader({ name: 'X-Auth-Client', required: false, description: 'Use web for HttpOnly refresh cookies; native clients receive the refresh token in JSON.' })
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  private cookieOptions(): CookieOptions {
    return { httpOnly: true, secure: this.config.get<string>('app.environment') === 'production', sameSite: 'strict', path: `/${this.config.getOrThrow<string>('app.prefix')}/auth` };
  }

  private output(tokens: AuthTokens, client: string | undefined, response: Response) {
    const { refreshToken, refreshExpiresAt, ...session } = tokens;
    if (client === 'web') {
      response.cookie(cookieName, refreshToken, { ...this.cookieOptions(), maxAge: Math.max(0, refreshExpiresAt - Date.now()) });
      return session;
    }
    return { ...session, refreshToken };
  }

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a Buyer or Seller account' })
  @ApiCreatedResponse({ type: SessionResponseDto })
  async register(@Body() input: RegisterDto, @Headers('x-auth-client') client: string | undefined, @Res({ passthrough: true }) response: Response) {
    return this.output(await this.auth.register(input), client, response);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiOkResponse({ type: SessionResponseDto })
  async login(@Body() input: LoginDto, @Headers('x-auth-client') client: string | undefined, @Res({ passthrough: true }) response: Response) {
    return this.output(await this.auth.login(input), client, response);
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Rotate a refresh token and issue a new access token' })
  @ApiOkResponse({ type: SessionResponseDto })
  async refresh(@Body() input: RefreshDto, @Headers('x-auth-client') client: string | undefined, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    if (client === 'web' && !request.get('origin')) throw new ForbiddenException('Browser refresh requires an Origin header.');
    const cookies = request.cookies as Record<string, unknown> | undefined;
    const token = client === 'web' ? cookies?.[cookieName] : input.refreshToken;
    try { return this.output(await this.auth.refresh(typeof token === 'string' ? token : undefined), client, response); }
    catch (error) { if (client === 'web' && error instanceof UnauthorizedException) response.clearCookie(cookieName, this.cookieOptions()); throw error; }
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOkResponse({ type: CurrentUserResponseDto })
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest) { return { user: request.user.user }; }

  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOkResponse({ type: LogoutResponseDto })
  @UseGuards(JwtAuthGuard)
  async logout(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.user);
    response.clearCookie(cookieName, this.cookieOptions());
    return { ok: true };
  }
}
