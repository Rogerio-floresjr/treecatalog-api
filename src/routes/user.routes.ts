import { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/user-controller';

export async function userRoutes(fastify: FastifyInstance) {
    const userController = new UserController();

    // Rota para listar (proteja com middleware de autenticação se necessário)
    fastify.get('/', userController.getAllUsers);
    
    // Rota para atualizar
    fastify.put('/:id', userController.updateUser);

    // Rota para deletar
    fastify.delete('/:id', userController.deleteUser);
}