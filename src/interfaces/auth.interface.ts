import { Users } from "../entity/user.entity";

export interface AuthConfig {
    jwtSecret: string;
    jwtExpiration: string;
    saltRounds: number;
    maxLoginAttempts: number
}

export interface IPasswordService {
    hashPassword(password: string): Promise<string>;
    comparePassword(password: string, hashedPassword: string): Promise<boolean>;
}

export interface ITokenService {
    generateToken(user: Users): string;
    generateTokenRefresh(user: Users): string;
    verifyToken(token: string): any;
    decodeToken(token: string): any;
    extractTokenFormHeader(authHeader: string): string | null;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface PasswordResetRequest {
    username: string;
    newPassword: string;
    confirmNewPassword: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    email: string;
    fullName: string;
    isAdmin?: number;
}