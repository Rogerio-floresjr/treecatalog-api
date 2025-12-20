import { FastifyInstance } from 'fastify';
import { TreeController } from '../controllers/tree-controller';

export async function treeRoutes(fastify: FastifyInstance) {
    const treeController = new TreeController();

    const treeCreateSchema = {
        type: 'object',
        properties: {
            localId: { type: 'string' },
            latitude: { type: 'string' },
            longitude: { type: 'string' },
            quadra: { type: 'string' },
            numeroArvore: { type: 'string' },
            cidade: { type: 'string' },
            estado: { type: 'string' },
            cep: { type: 'string' },
            bairro: { type: 'string' },
            ruaPraca: { type: 'string' },
            numeroCasa: { type: 'string' },
            nomePopular: { type: 'string' },
            nomeCientifico: { type: 'string' },
            altura: { type: 'string' },
            cap: { type: 'string' },
            calcadaLargura: { type: 'string' },
            calcadaFaixaLivre: { type: 'string' },
            estacionamento: { type: 'string' },
            detalhamento: { type: 'string' },
            parasitas: { type: 'string' },
            alturaCopaAcima210: { type: 'string' },
            condicaoFitossanitaria: { type: 'string' },
            podaAtual: { type: 'string' },
            tratamento: { type: 'string' },
            probabilidade: { type: 'string' },
            impacto: { type: 'string' },
            areaPermeavelMaior1m2: { type: 'string' },
            
            presencaDe: { 
                type: 'array',
                items: { type: 'string' }
            },
            
            conflitos: { 
                type: 'array',
                items: { type: 'string' }
            },
            photos: {
                type: 'array',
                items: { type: 'string' }
            }
        }
    };

    const treeSyncSchema = {
        type: 'object',
        required: ['trees', 'deviceId'],
        properties: {
            trees: {
                type: 'array',
                items: treeCreateSchema
            },
            deviceId: { type: 'string' },
            lastSyncTimestamp: { type: 'string' }
        }
    };

    fastify.get('/dashboard', treeController.getDashboard);

    // Create a new tree
    fastify.post('/trees', {
        schema: {
            body: treeCreateSchema,
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object' }
                    }
                },
                400: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                },
                401: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean'},
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, treeController.createTree);

    // Sync trees (batch operation for offline sync)
    fastify.post('/trees/sync', {
        schema: {
            body: treeSyncSchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        results: {
                            type: 'object',
                            properties: {
                                success: { 
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            localId: { type: 'string' },
                                            id: { type: 'number' },
                                            uniqueId: { type: 'string' }
                                        }
                                    }
                                },
                                errors: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            localId: { type: 'string' },
                                            error: { type: 'string' }
                                        }
                                    }
                                },
                                conflicts: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            localId: { type: 'string' },
                                            reason: { type: 'string' },
                                            serverData: { type: 'object' }
                                        }
                                    }
                                }
                            }
                        },
                        serverTimestamp: { type: 'string' }
                    }
                }
            }
        }
    }, treeController.syncTrees);

    // Update tree
    fastify.put('/trees/:uniqueId', {
        schema: {
            params: {
                type: 'object',
                required: ['uniqueId'],
                properties: {
                    uniqueId: { type: 'string' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    ...treeCreateSchema.properties
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object' }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, treeController.updateTree);

    // Delete tree
    fastify.delete('/trees/:uniqueId', {
        schema: {
            params: {
                type: 'object',
                required: ['uniqueId'],
                properties: {
                    uniqueId: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, treeController.deleteTree);

    // Get trees with pagination and filtering
    fastify.get('/trees', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'integer', minimum: 1 },
                    limit: { type: 'integer', minimum: 1, maximum: 100 },
                    quadra: { type: 'string' },
                    cidade: { type: 'string' },
                    estado: { type: 'string' },
                    search: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { 
                            type: 'array',
                            items: { 
                                type: 'object',
                                additionalProperties: true 
                            }
                        },
                        total: { type: 'number' },
                        page: { type: 'number' },
                        limit: { type: 'number' }
                    }
                }
            }
        }
    }, treeController.getTrees); 

    // Get trees by user
    fastify.get('/users/:userId/trees', {
        schema: {
            params: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: { type: 'string' }
                }
            },
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'integer', minimum: 1 },
                    limit: { type: 'integer', minimum: 1, maximum: 100 },
                    startDate: { type: 'string' },
                    endDate: { type: 'string' },
                    quadra: { type: 'string' },
                    cidade: { type: 'string' },
                    estado: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { 
                            type: 'array',
                            items: { 
                                type: 'object',
                                additionalProperties: true 
                            }
                        },
                        total: { type: 'number' },
                        page: { type: 'number' },
                        limit: { type: 'number' }
                    }
                }
            }
        }
    }, treeController.getUserTrees);
}