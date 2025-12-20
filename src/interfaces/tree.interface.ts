export interface TreeCreateRequest {
    localId: string;
    userId: string;
    userName: string;
    latitude: string;
    longitude: string;
    quadra: string;
    numeroArvore: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    bairro?: string;
    ruaPraca?: string;
    numeroCasa?: string;
    nomePopular?: string;
    nomeCientifico?: string;
    altura?: string;
    cap?: string;
    calcadaLargura?: string;
    calcadaFaixaLivre?: string;
    estacionamento?: string;
    detalhamento?: string;
    parasitas?: string;
    alturaCopaAcima210?: string;
    condicaoFitossanitaria?: string;
    podaAtual?: string;
    tratamento?: string;
    probabilidade?: string;
    impacto?: string;
    areaPermeavelMaior1m2?: string;
    presencaDe?: string;
    conflitos?: string;
    photos?: string[];
}

export interface DashboardStatsResponse {
    stats: {
        totalTrees: number;
        totalCities: number;
        totalStates: number;
    };
    recentActivity: any[]; // Gráfico (Mês/Total)
    recentRecords: any[]; // Lista dos 5 últimos
    mapPoints: Array<{
        uniqueId: string;
        latitude: string;
        longitude: string;
        nomePopular: string;
    }>;
}

export interface TreeUpdateRequest extends Partial<TreeCreateRequest> {
    uniqueId: string;
}

export interface TreeSyncRequest {
    trees: TreeCreateRequest[];
    deviceId: string;
    lastSyncTimestamp?: string;
}

export interface TreeSyncResponse {
    success: boolean;
    results: {
        success: Array<{
            localId: string;
            id: number;
            uniqueId: string;
        }>;
        errors: Array<{
            localId: string;
            error: string;
        }>;
        conflicts: Array<{
            localId: string;
            reason: string;
            serverData: any;
        }>;
    };
    serverTimestamp: string;
}

export interface TreeQueryParams {
    userId?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    quadra?: string;
    cidade?: string;
    estado?: string;
    search?: string;
}

export interface TreeServiceResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    total?: number;
    page?: number;
    limit?: number;
}

export interface ITreeService {
    createTree(data: TreeCreateRequest, user: any): Promise<TreeServiceResponse>;
    updateTree(uniqueId: string, data: Partial<TreeCreateRequest>): Promise<TreeServiceResponse>;
    getTrees(params: TreeQueryParams): Promise<TreeServiceResponse>;
    deleteTree(uniqueId: string): Promise<TreeServiceResponse>;
    syncTrees(syncData: TreeSyncRequest, user: any): Promise<TreeSyncResponse>;
    getTreesByUser(userId: string, params?: TreeQueryParams): Promise<TreeServiceResponse>;
}

export interface TreeValidationError {
    field: string;
    message: string;
}
