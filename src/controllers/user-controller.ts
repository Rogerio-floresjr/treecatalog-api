import { FastifyReply, FastifyRequest } from 'fastify';
import AppDataSource from '../config/db';
import { Users } from '../entity/user.entity';
import { AuthConfig } from '../interfaces/auth.interface';
import { AuthService } from '../services/auth-service';

// Assumindo que você tem uma interface para update
interface UpdateUserRequest {
    id: number;
    fullName: string;
    email: string;
    username: string;
    isAdmin: number;
    password?: string;
}

export class UserController {
    private userRepository = AppDataSource.getRepository(Users);
    
    // Configuração necessária para reutilizar o hash de senha do AuthService se precisar
    private authConfig: AuthConfig = {
        jwtSecret: process.env.JWT_SECRET || 'secret',
        jwtExpiration: process.env.JWT_EXPIRATION || '1d',
        saltRounds: parseInt(process.env.SALT_ROUNDS || '10'),
        maxLoginAttempts: 5
    };
    private authService = new AuthService(this.userRepository, this.authConfig);

    constructor() {
        this.getAllUsers = this.getAllUsers.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
    }

    async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
        try {
            // Retorna todos os usuários, ordenados por nome
            // Removemos campos sensíveis como hash de senha e tokens
            const users = await this.userRepository.find({
                select: ['id', 'username', 'email', 'fullName', 'isAdmin', 'lastLogin'],
                order: { fullName: 'ASC' }
            });
            return reply.send(users);
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ message: 'Erro ao buscar usuários' });
        }
    }

    async updateUser(request: FastifyRequest<{ Body: UpdateUserRequest, Params: { id: number } }>, reply: FastifyReply) {
        const { id } = request.params;
        const { fullName, email, username, isAdmin, password } = request.body;

        try {
            const user = await this.userRepository.findOneBy({ id });
            if (!user) return reply.status(404).send({ message: 'Usuário não encontrado' });

            user.fullName = fullName;
            user.email = email;
            user.username = username;
            user.isAdmin = isAdmin;

            // Se enviou senha nova, faz o hash (usando a lógica interna do auth service ou direta)
            if (password && password.length >= 8) {
                // Aqui estamos acessando o passwordService indiretamente ou recriando a lógica
                // Para simplificar, vamos assumir que você pode chamar o método público ou usar bcrypt direto aqui
                // O ideal é expor um método updatePassword no AuthService
                 const bcrypt = require('bcrypt');
                 user.passwordHash = await bcrypt.hash(password, 10);
            }

            await this.userRepository.save(user);
            return reply.send({ success: true, message: 'Usuário atualizado com sucesso' });
        } catch (error) {
            return reply.status(500).send({ message: 'Erro ao atualizar usuário' });
        }
    }

    async deleteUser(request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            await this.userRepository.delete(id);
            return reply.send({ success: true, message: 'Usuário removido' });
        } catch (error) {
            return reply.status(500).send({ message: 'Erro ao remover usuário' });
        }
    }
}