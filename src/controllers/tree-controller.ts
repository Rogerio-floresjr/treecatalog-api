import { FastifyRequest, FastifyReply } from 'fastify';
import { Repository } from 'typeorm';
import { TreeRecord } from '../entity/tree-record.entity';
import { Users } from '../entity/user.entity';
import { 
    TreeCreateRequest, 
    TreeUpdateRequest, 
    TreeSyncRequest, 
    TreeQueryParams 
} from '../interfaces/tree.interface';
import { AuthConfig } from '../interfaces/auth.interface';
import AppDataSource from '../config/db';
import { AuthService } from '../services/auth-service';
import { TreeService } from '../services/tree-service';

export class TreeController {
    private treeService: TreeService;
    private treeRepository: Repository<TreeRecord>;
    private authService: AuthService;

    constructor() {
        this.treeRepository = AppDataSource.getRepository(TreeRecord);
        this.treeService = new TreeService(this.treeRepository);
        
        // Initialize auth service
        const authConfig: AuthConfig = {
            jwtSecret: process.env.JWT_SECRET || 'default-secret',
            jwtExpiration: process.env.JWT_EXPIRATION || '24h',
            saltRounds: parseInt(process.env.SALT_ROUNDS || '12'),
            maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
        };
        
        const userRepository = AppDataSource.getRepository(Users);
        this.authService = new AuthService(userRepository, authConfig);

        // Bind methods to preserve 'this' context
        this.createTree = this.createTree.bind(this);
        this.updateTree = this.updateTree.bind(this);
        this.getTrees = this.getTrees.bind(this);
        this.getUserTrees = this.getUserTrees.bind(this);
        this.deleteTree = this.deleteTree.bind(this);
        this.syncTrees = this.syncTrees.bind(this);
    }

    // Extract user from JWT token
    private async extractUserFromToken(request: FastifyRequest): Promise<any | null> {
        try {
            const authHeader = request.headers.authorization;
            
            if (!authHeader) {
                return null;
            }

            const parts = authHeader.split(' ');
            if (parts.length !== 2 || parts[0] !== 'Bearer') {
                return null;
            }

            const token = parts[1];
            const decoded = await this.authService.verifyToken(token);
            
            return {
                id: decoded.id,
                username: decoded.username,
                email: decoded.email,
                fullname: decoded.fullname,
                isAdmin: decoded.isAdmin
            };
        } catch (error) {
            console.error('Token verification failed:', error);
            return null;
        }
    }

    // Create tree handler
    async createTree(
        request: FastifyRequest<{ Body: TreeCreateRequest }>,
        reply: FastifyReply
    ) {
        try {
            // Extract user from JWT token
            const user = await this.extractUserFromToken(request);
            
            if (!user) {
                return reply.code(401).send({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const result = await this.treeService.createTree(request.body, user);

            if (!result.success) {
                return reply.code(400).send(result);
            }

            return reply.code(201).send(result);
        } catch (error) {
            request.log.error('Tree creation error:', error);
            return reply.code(500).send({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Update tree handler
    async updateTree(
        request: FastifyRequest<{ 
            Params: { uniqueId: string }, 
            Body: Partial<TreeCreateRequest> 
        }>,
        reply: FastifyReply
    ) {
        try {
            const { uniqueId } = request.params;
            const result = await this.treeService.updateTree(uniqueId, request.body);

            if (!result.success) {
                const statusCode = result.message === 'Tree not found' ? 404 : 400;
                return reply.code(statusCode).send(result);
            }

            return reply.code(200).send(result);
        } catch (error) {
            request.log.error('Tree update error:', error);
            return reply.code(500).send({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get trees with filters and pagination
    async getTrees(
        request: FastifyRequest<{ Querystring: TreeQueryParams }>,
        reply: FastifyReply
    ) {
        try {
            const queryParams: TreeQueryParams = {
                userId: request.query.userId,
                page: request.query.page ? parseInt(request.query.page.toString()) : 1,
                limit: request.query.limit ? parseInt(request.query.limit.toString()) : 10,
                startDate: request.query.startDate,
                endDate: request.query.endDate,
                quadra: request.query.quadra,
                cidade: request.query.cidade,
                estado: request.query.estado
            };

            const result = await this.treeService.getTrees(queryParams);

            if (!result.success) {
                return reply.code(400).send(result);
            }

            return reply.code(200).send(result);
        } catch (error) {
            request.log.error('Trees retrieval error:', error);
            return reply.code(500).send({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get trees by user
    async getUserTrees(
        request: FastifyRequest<{ 
            Params: { userId: string }, 
            Querystring: Omit<TreeQueryParams, 'userId'> 
        }>,
        reply: FastifyReply
    ) {
        try {
            const { userId } = request.params;
            const queryParams: TreeQueryParams = {
                ...request.query,
                userId,
                page: request.query.page ? parseInt(request.query.page.toString()) : 1,
                limit: request.query.limit ? parseInt(request.query.limit.toString()) : 10
            };

            const result = await this.treeService.getTreesByUser(userId, queryParams);

            if (!result.success) {
                return reply.code(400).send(result);
            }

            return reply.code(200).send(result);
        } catch (error) {
            request.log.error('User trees retrieval error:', error);
            return reply.code(500).send({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Delete tree handler
    async deleteTree(
        request: FastifyRequest<{ Params: { uniqueId: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { uniqueId } = request.params;
            const result = await this.treeService.deleteTree(uniqueId);

            if (!result.success) {
                const statusCode = result.message === 'Tree not found' ? 404 : 400;
                return reply.code(statusCode).send(result);
            }

            return reply.code(200).send(result);
        } catch (error) {
            request.log.error('Tree deletion error:', error);
            return reply.code(500).send({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Sync trees (batch operation for offline sync) - requires authentication
    async syncTrees(
        request: FastifyRequest<{ Body: TreeSyncRequest }>,
        reply: FastifyReply
    ) {
        try {
            // Extract user from JWT token
            const user = await this.extractUserFromToken(request);
            
            if (!user) {
                return reply.code(401).send({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const result = await this.treeService.syncTrees(request.body, user);

            if (!result.success) {
                return reply.code(400).send(result);
            }

            return reply.code(200).send(result);
        } catch (error) {
            request.log.error('Tree sync error:', error);
            return reply.code(500).send({
                success: false,
                message: 'Internal server error during sync'
            });
        }
    }

}