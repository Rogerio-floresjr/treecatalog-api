import { Brackets, Repository } from "typeorm";
import { v4 as uuidv4 } from 'uuid';
import { TreeRecord } from "../entity/tree-record.entity";
import { DashboardStatsResponse, ITreeService, TreeCreateRequest, TreeQueryParams, TreeServiceResponse, TreeSyncRequest, TreeSyncResponse, TreeValidationError } from "../interfaces/tree.interface";

export class TreeService implements ITreeService {
    private treeRepository: Repository<TreeRecord>;

    constructor(treeRepository: Repository<TreeRecord>) {
        this.treeRepository = treeRepository
    }

    private validateTreeData(data: TreeCreateRequest, user: any): TreeValidationError[] {
        const errors: TreeValidationError[] = [];

        // User info comes from JWT token, not request body
        if (!user || !user.id) {
            errors.push({ field: 'authentication', message: 'User authentication required' });
        }

        // Email validation - use user's email from token
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (user && user.email && !emailRegex.test(user.email)) {
            errors.push({ field: 'userEmail', message: 'Invalid email format' });
        }

        return errors;
    }

    // Function to create tree
    async createTree(data: TreeCreateRequest, user: any): Promise<TreeServiceResponse> {
        try {
            // Validate input data
            const validationErrors = this.validateTreeData(data, user);
            if (validationErrors.length > 0) {
                return {
                    success: false,
                    message: 'Validation failed',
                    data: { errors: validationErrors }
                };
            }

            // Check if tree with same localId already exists
            if (data.localId) {
                const existingTree = await this.treeRepository.findOne({
                    where: { uniqueId: data.localId }
                });
                if (existingTree) {
                    return {
                        success: false,
                        message: 'Tree with this ID already exists'
                    };
                }
            }

            const currentTimestamp = new Date().toISOString();
            const uniqueId = data.localId || uuidv4();

            // Get next ID for the id field
            const result = await this.treeRepository
                .createQueryBuilder('tree')
                .select('MAX(tree.id)', 'maxId')
                .getRawOne();

            const nextId = result?.maxId ? result.maxId + 1 : 1;

            const numeroArvore = data.numeroArvore || '1';

            // Create new tree record 
            const newTree = this.treeRepository.create({
                id: nextId,
                uniqueId,
                userId: user.id,
                userName: user.fullname || user.username,
                userEmail: user.email,
                dataCadastro: currentTimestamp,
                dataEdit: currentTimestamp,
                latitude: data.latitude,
                longitude: data.longitude,
                quadra: data.quadra,
                numeroArvore: numeroArvore,
                cidade: data.cidade,
                estado: data.estado,
                cep: data.cep,
                bairro: data.bairro,
                ruaPraca: data.ruaPraca,
                numeroCasa: data.numeroCasa,
                nomePopular: data.nomePopular,
                nomeCientifico: data.nomeCientifico,
                altura: data.altura,
                cap: data.cap,
                calcadaLargura: data.calcadaLargura,
                calcadaFaixaLivre: data.calcadaFaixaLivre,
                estacionamento: data.estacionamento,
                detalhamento: data.detalhamento,
                parasitas: data.parasitas,
                alturaCopaAcima210: data.alturaCopaAcima210,
                condicaoFitossanitaria: data.condicaoFitossanitaria,
                podaAtual: data.podaAtual,
                tratamento: data.tratamento,
                probabilidade: data.probabilidade,
                impacto: data.impacto,
                areaPermeavelMaior1m2: data.areaPermeavelMaior1m2,
                presencaDe: data.presencaDe,
                conflitos: data.conflitos
            });

            const savedTree = await this.treeRepository.save(newTree);

            return {
                success: true,
                message: 'Tree registered successfully',
                data: savedTree
            };
        } catch (error) {
            console.error('Tree creation error:', error);
            return {
                success: false,
                message: 'Failed to register tree'
            };
        }
    }

    // Function to update tree
    async updateTree(uniqueId: string, data: Partial<TreeCreateRequest>): Promise<TreeServiceResponse> {
        try {
            const existingTree = await this.treeRepository.findOne({
                where: { uniqueId }
            });

            if (!existingTree) {
                return {
                    success: false,
                    message: 'Tree not found'
                };
            }
            
            // Update timestamp
            const updatedData = {
                ...data,
                dataEdit: new Date().toISOString()
            };

            await this.treeRepository.update({uniqueId}, updatedData);

            const updatedTree = await this.treeRepository.findOne({
                where: { uniqueId }
            });
            
            return {
                success: true,
                message: 'Tree updated successfully',
                data: updatedTree
            };
        }catch (error) {
            console.error('Tree update error:', error);
            return {
                success: false,
                message: 'Faild to update tree'        
            };
        }
    }

    // Function to get all tree records
    async getTrees(params: TreeQueryParams): Promise<TreeServiceResponse> {
        try {
            const queryBuilder = this.treeRepository.createQueryBuilder('tree_records');

            // Filtros existentes
            if (params.userId) {
                queryBuilder.andWhere('tree_records.userId = :userId', { userId: params.userId });
            }
            if (params.cidade) {
                queryBuilder.andWhere('tree_records.cidade ILIKE :cidade', { cidade: `%${params.cidade}%` });
            }

            
            if (params.search) {
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('tree_records.cidade ILIKE :search', { search: `%${params.search}%` })
                      .orWhere('tree_records.nomePopular ILIKE :search', { search: `%${params.search}%` })
                      .orWhere('tree_records.userName ILIKE :search', { search: `%${params.search}%` })
                      .orWhere('tree_records.cep ILIKE :search', { search: `%${params.search}%` })
                      .orWhere('tree_records.numeroArvore ILIKE :search', { search: `%${params.search}%` }) // Busca por ID também
                }));
            }
            

            // Paginação Obrigatória
            const page = params.page ? Number(params.page) : 1;
            const limit = params.limit ? Number(params.limit) : 50; 
            const skip = (page - 1) * limit;

            queryBuilder.skip(skip).take(limit);
            queryBuilder.orderBy('tree_records.dataCadastro', 'DESC');

            const [trees, total] = await queryBuilder.getManyAndCount();

            return {
                success: true,
                message: 'Tree retrieved successfully',
                data: trees,
                total,
                page,
                limit
            };
        } catch (error) {
            console.error('Tree retrieval error:', error);
            return {
                success: false,
                message: 'Failed to retrieve trees'
            }
        }
    }

    // Dashboard da tab home
    
    async getDashboardData(userId: string): Promise<TreeServiceResponse<DashboardStatsResponse>> {
        try {
            // Executa as 3 queries essenciais em paralelo para máxima performance
            const [recentRecordsResult, mapPointsResult, chartDataResult] = await Promise.all([
                
                // 1. Widget Lista: Apenas os 5 últimos
                this.treeRepository.find({
                    select: {
                        uniqueId: true,
                        nomePopular: true,
                        nomeCientifico: true,
                        dataCadastro: true
                    },
                    order: { dataCadastro: 'DESC' },
                    take: 5
                }),

                // 2. Widget Mapa: Apenas as 50 últimas coletas com Lat/Long válidos
                this.treeRepository
                    .createQueryBuilder('tree')
                    .select(['tree.uniqueId', 'tree.latitude', 'tree.longitude', 'tree.nomePopular'])
                    // Garante que não pegamos árvores sem localização
                    .where("tree.latitude IS NOT NULL AND tree.latitude != ''")
                    .andWhere("tree.longitude IS NOT NULL AND tree.longitude != ''")
                    .orderBy('tree.dataCadastro', 'DESC')
                    .take(50) // Limite rígido de 50 pinos
                    .getMany(),

                // 3. Widget Gráfico: Agrupamento por mês via SQL
                // Extrai o 'YYYY-MM' da string de data e conta
                this.treeRepository
                    .createQueryBuilder('tree')
                    .select("SUBSTRING(tree.dataCadastro, 1, 7)", "month") 
                    .addSelect("COUNT(*)", "count")
                    .groupBy("month")
                    .orderBy("month", "DESC")
                    .limit(6)
                    .getRawMany()
            ]);

            // --- TRATAMENTO DE DADOS ---
            const formattedRecentRecords = recentRecordsResult.map(record => ({
                uniqueId: record.uniqueId,
                nomePopular: record.nomePopular || 'Sem identificação',
                nomeCientifico: record.nomeCientifico || '',
                dataCadastro: record.dataCadastro
            }));

            const formattedMapPoints = mapPointsResult.map(point => ({
                uniqueId: point.uniqueId,
                latitude: point.latitude,
                longitude: point.longitude,
                nomePopular: point.nomePopular || 'Árvore'
            }));

            // Formata o gráfico (Inverte para ordem cronológica: Jan -> Fev)
            const formattedChart = chartDataResult.map(item => ({
                label: item.month, 
                value: parseInt(item.count) 
            })).reverse();

            return {
                success: true,
                message: 'Dashboard data retrieved',
                data: {
                    recentRecords: formattedRecentRecords,
                    mapPoints: formattedMapPoints,
                    recentActivity: formattedChart
                }
            };

        } catch (error) {
            console.error('Dashboard error:', error);
            return { success: false, message: 'Failed to load dashboard' };
        }
    }

    
    // Function to get tree by user ID
    async getTreesByUser(userId: string, params?: TreeQueryParams): Promise<TreeServiceResponse> {
        return this.getTrees({ ...params, userId })
    }

    // Function to delete tree
    async deleteTree(uniqueId: string): Promise<TreeServiceResponse> {
        try {
            const existingTree = await this.treeRepository.findOne({
                where: { uniqueId } 
            })

            if (!existingTree) {
                return {
                    success: false,
                    message: 'Tree not found'
                };
            }

            await this.treeRepository.delete({ uniqueId }) 

            return {
                success: true,
                message: 'Tree deleted successfully'
            };
        }catch (error) {
            console.error('Delete tree error:', error);
            return {
                success: false,
                message: 'Failed to delete tree'
            }
        }
    }

    // Function to sync trees
    async syncTrees(syncData: TreeSyncRequest, user: any): Promise<TreeSyncResponse> {
        try {
            const results = {
                success: [],
                errors: [],
                conflicts: []
            };

            for (const treeData of syncData.trees) {
                try {
                    // Check if tree already exists
                    const existingTree = await this.treeRepository.findOne({
                        where: { uniqueId: treeData.localId }
                    });

                    if (existingTree) {
                        // Handle conflict - check timestamps
                        const existingDate = new Date(existingTree.dataEdit);
                        const incomingDate = new Date();

                        if (incomingDate > existingDate) {
                            // Update existing tree with user info from JWT
                            await this.treeRepository.update(
                                { uniqueId: treeData.localId },
                                {
                                    latitude: treeData.latitude,
                                    longitude: treeData.longitude,
                                    quadra: treeData.quadra,
                                    numeroArvore: treeData.numeroArvore,
                                    cidade: treeData.cidade,
                                    estado: treeData.estado,
                                    cep: treeData.cep,
                                    bairro: treeData.bairro,
                                    ruaPraca: treeData.ruaPraca,
                                    numeroCasa: treeData.numeroCasa,
                                    nomePopular: treeData.nomePopular,
                                    nomeCientifico: treeData.nomeCientifico,
                                    altura: treeData.altura,
                                    cap: treeData.cap,
                                    calcadaLargura: treeData.calcadaLargura,
                                    calcadaFaixaLivre: treeData.calcadaFaixaLivre,
                                    estacionamento: treeData.estacionamento,
                                    detalhamento: treeData.detalhamento,
                                    parasitas: treeData.parasitas,
                                    alturaCopaAcima210: treeData.alturaCopaAcima210,
                                    condicaoFitossanitaria: treeData.condicaoFitossanitaria,
                                    podaAtual: treeData.podaAtual,
                                    tratamento: treeData.tratamento,
                                    probabilidade: treeData.probabilidade,
                                    impacto: treeData.impacto,
                                    areaPermeavelMaior1m2: treeData.areaPermeavelMaior1m2,
                                    presencaDe: treeData.presencaDe,
                                    conflitos: treeData.conflitos,
                                    userId: user.id,
                                    userName: user.fullname || user.username,
                                    userEmail: user.email,
                                    dataEdit: new Date().toISOString()
                                }
                            );

                            const updatedTree = await this.treeRepository.findOne({
                                where: { uniqueId: treeData.localId }
                            });

                            results.success.push({
                                localId: treeData.localId,
                                id: updatedTree.id,
                                uniqueId: updatedTree.uniqueId
                            });
                        } else {
                            results.conflicts.push({
                                localId: treeData.localId,
                                reason: 'Server version is newer',
                                serverData: existingTree
                            });
                        }
                    } else {
                        // Create new tree
                        const createResult = await this.createTree(treeData, user);
                        
                        if (createResult.success) {
                            results.success.push({
                                localId: treeData.localId,
                                id: createResult.data.id,
                                uniqueId: createResult.data.uniqueId
                            });
                        } else {
                            results.errors.push({
                                localId: treeData.localId,
                                error: createResult.message
                            });
                        }
                    }
                } catch (error) {
                    results.errors.push({
                        localId: treeData.localId,
                        error: error.message
                    });
                }
            }

            return {
                success: true,
                results,
                serverTimestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Sync error:', error);
            return {
                success: false,
                results: {
                    success: [],
                    errors: [],
                    conflicts: []
                },
                serverTimestamp: new Date().toISOString()
            };
        }
    }
}
