// src/controllers/auth.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { Repository } from 'typeorm';
import { Users } from '../entity/user.entity';
import { AuthConfig, LoginRequest, PasswordResetRequest, RegisterRequest } from '../interfaces/auth.interface';
import AppDataSource from '../config/db';
import { AuthService } from '../services/auth-service';

export class AuthController {
    private authService: AuthService;
    private userRepository: Repository<Users>;

    constructor() {
        // Get auth config from environment
        const authConfig: AuthConfig = {
            jwtSecret: process.env.JWT_SECRET,
            jwtExpiration: process.env.JWT_EXPIRATION,
            saltRounds: parseInt(process.env.SALT_ROUNDS),
            maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS),
        };

        this.userRepository = AppDataSource.getRepository(Users);
        this.authService = new AuthService(this.userRepository, authConfig);

        // Bind methods to preserve 'this' context
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
        this.resetPassword = this.resetPassword.bind(this);
    }

    // Register user handler
    async register(
        request: FastifyRequest<{ Body: RegisterRequest }>,
        reply: FastifyReply
    ) {
        try {
            const { username, password, email, fullName, isAdmin } = request.body;

            const result = await this.authService.registerUser({
                username,
                passwordHash: password,
                email,
                fullName,
                isAdmin: isAdmin || 0,
                createdAt: new Date().toISOString()
            });

            if (!result.success) {
                return reply.code(400).send(result);
            }

            return reply.code(201).send(result);
        } catch (error) {
            request.log.error('Registration error:', error);
            return reply.code(500).send({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Login handler
    async login(
        request: FastifyRequest<{ Body: LoginRequest }>,
        reply: FastifyReply
    ) {
        try {
            const loginData: LoginRequest = {
                username: request.body.username,
                password: request.body.password
            };

            const result = await this.authService.login(loginData);

            if (!result.success) {
                return reply.code(401).send(result);
            }

            return reply.code(200).send(result);
        } catch (error) {
            request.log.error('Login error:', error);
            return reply.code(500).send({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Reset password handler
    async resetPassword(
        request: FastifyRequest<{ Body: PasswordResetRequest }>,
        reply: FastifyReply
    ) {
        try {
            const resetData: PasswordResetRequest = {
                username: request.body.username,
                newPassword: request.body.newPassword,
                confirmNewPassword: request.body.confirmNewPassword
            };

            const result = await this.authService.resetPassword(resetData);

            if (!result.success) {
                return reply.code(400).send(result);
            }

            return reply.code(200).send(result);
        } catch (error) {
            request.log.error('Password reset error:', error);
            return reply.code(500).send({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}