import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import AppDataSource from './config/db';
import { authRoutes } from './routes/auth.routes';
import { treeRoutes } from './routes/tree.routes';

const fastify = Fastify({
    logger: true 
});

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

async function startServer() {
    try {
        await fastify.register(cors, {
            origin: [
                'http://localhost:8081', // Expo web dev server
                'http://localhost:19006',
                'http://127.0.0.1:8081',
                'http://127.0.0.1:19006'
            ],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        });

        fastify.get('/', async (request, reply) => {
            return { hello: 'api' }
        });

        await AppDataSource.initialize();
        console.log('Data Source has been initialized!');
        
        await fastify.register(authRoutes, { prefix: '/auth' });
        await fastify.register(treeRoutes, { prefix: '/api' })
        
        await fastify.listen({ 
            port: port,
            host: '0.0.0.0' 
        });
        console.log(`Server is running on port ${port}`);
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
}

startServer();