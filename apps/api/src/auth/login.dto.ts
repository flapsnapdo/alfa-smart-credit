import { IsEmail, IsString, MinLength } from 'class-validator';

/** Что приходит в теле запроса POST /auth/login */
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}