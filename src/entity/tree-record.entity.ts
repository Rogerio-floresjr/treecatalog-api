import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity('tree_records')
export class TreeRecord {
    @Column()
    id: number;

    @PrimaryColumn({ name: 'unique_id' })
    uniqueId: string;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'user_name' })
    userName: string;

    @Column({ name: 'user_email' })
    userEmail: string;

    @Column({ name: 'data_cadastro' })
    dataCadastro: string;

    @Column({ name: 'data_edit' })
    dataEdit: string;

    @Column()
    latitude: string;

    @Column()
    longitude: string;

    @Column()
    quadra: string;

    @Column({ name: 'numero_arvore' })
    numeroArvore: string;

    @Column({ nullable: true })
    cidade?: string;

    @Column({ nullable: true })
    estado?: string;

    @Column({ nullable: true })
    cep?: string;

    @Column({ nullable: true })
    bairro?: string;

    @Column({ name: 'rua_praca', nullable: true })
    ruaPraca?: string;

    @Column({ name: 'numero_casa', nullable: true })
    numeroCasa?: string;

    @Column({ name: 'nome_popular', nullable: true })
    nomePopular?: string;

    @Column({ name: 'nome_cientifico', nullable: true })
    nomeCientifico?: string;

    @Column({ nullable: true })
    altura?: string;

    @Column({ nullable: true })
    cap?: string;

    @Column({ name: 'calcada_largura', nullable: true })
    calcadaLargura?: string;

    @Column({ name: 'calcada_faixa_livre', nullable: true })
    calcadaFaixaLivre?: string;

    @Column({ nullable: true })
    estacionamento?: string;

    @Column({ nullable: true })
    detalhamento?: string;

    @Column({ nullable: true })
    parasitas?: string;

    @Column({ name: 'altura_copa_acima_2_10', nullable: true })
    alturaCopaAcima210?: string;

    @Column({ name: 'condicao_fitossanitaria', nullable: true })
    condicaoFitossanitaria?: string;

    @Column({ name: 'poda_atual', nullable: true })
    podaAtual?: string;

    @Column({ nullable: true })
    tratamento?: string;

    @Column({ nullable: true })
    probabilidade?: string;

    @Column({ nullable: true })
    impacto?: string;

    @Column({ name: 'area_permeavel_maior_1m2', nullable: true })
    areaPermeavelMaior1m2?: string;

    @Column({ name: 'presenca_de', nullable: true })
    presencaDe?: string;

    @Column({ nullable: true })
    conflitos?: string;
}