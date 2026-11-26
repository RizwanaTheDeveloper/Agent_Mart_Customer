import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountRole } from '@prisma/client';
import { refreshPattern } from '../../../common/constants/auth.constants.js';

export class LoginDto {
  @ApiProperty({ example: 'buyer@example.com' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ minLength: 1, maxLength: 128, format: 'password' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({ enum: AccountRole, description: 'Selected login workspace. A matching account role is required when provided.' })
  @IsOptional()
  @IsEnum(AccountRole)
  role?: AccountRole;
}

export class RegisterDto extends LoginDto {
  @ApiProperty({ minLength: 1, maxLength: 100 })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ minLength: 12, maxLength: 128, format: 'password' })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  declare password: string;

}

export class RefreshDto {
  @ApiPropertyOptional({ description: 'Native clients send their refresh token here. Web clients use the HttpOnly cookie.' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  @Matches(refreshPattern)
  refreshToken?: string;
}

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: AccountRole }) role!: AccountRole;
}

export class SessionResponseDto {
  @ApiProperty({ description: 'Short-lived JWT; send in Authorization: Bearer.' }) accessToken!: string;
  @ApiProperty({ description: 'Access-token expiry as Unix milliseconds.' }) expiresAt!: number;
  @ApiProperty({ type: UserResponseDto }) user!: UserResponseDto;
  @ApiPropertyOptional({ description: 'Native clients only. Browser refresh credentials are in an HttpOnly cookie.' }) refreshToken?: string;
}

export class CurrentUserResponseDto {
  @ApiProperty({ type: UserResponseDto }) user!: UserResponseDto;
}

export class LogoutResponseDto {
  @ApiProperty({ enum: [true] }) ok!: boolean;
}
