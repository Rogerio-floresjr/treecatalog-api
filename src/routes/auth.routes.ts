// src/routes/auth.routes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthController } from '../controllers/auth-controller';
import { LoginRequest, PasswordResetRequest, RegisterRequest } from '../interfaces/auth.interface';

export async function authRoutes(fastify: FastifyInstance) {
    const authController = new AuthController();

    // Register user
    fastify.post<{ Body: RegisterRequest }>('/register', {
        schema: {
            body: {
                type: 'object',
                required: ['username', 'password', 'email', 'fullName'],
                properties: {
                    username: { type: 'string', minLength: 3, maxLength: 50 },
                    password: { type: 'string', minLength: 8 },
                    email: { type: 'string', format: 'email' },
                    fullName: { type: 'string', minLength: 2 },
                    isAdmin: { type: 'number', minimum: 0, maximum: 1 }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'number' },
                                username: { type: 'string' },
                                email: { type: 'string' },
                                fullName: { type: 'string' },
                                isAdmin: { type: 'number' },
                                createdAt: { type: 'string' }
                            }
                        }
                    }
                },
                400: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, authController.register);

    // Login
    fastify.post<{ Body: LoginRequest }>('/login', {
        schema: {
            body: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                    username: { type: 'string' },
                    password: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        token: { type: 'string' },
                        refreshToken: { type: 'string' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'number' },
                                username: { type: 'string' },
                                email: { type: 'string' },
                                fullName: { type: 'string' },
                                isAdmin: { type: 'number' }
                            }
                        }
                    }
                },
                401: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, authController.login);

    // Reset password
    fastify.post<{ Body: PasswordResetRequest }>('/reset-password', {
        schema: {
            body: {
                type: 'object',
                required: ['username', 'newPassword', 'confirmNewPassword'],
                properties: {
                    username: { type: 'string' },
                    newPassword: { type: 'string', minLength: 8 },
                    confirmNewPassword: { type: 'string', minLength: 8 }
                }
            }
        }
    }, authController.resetPassword);
}