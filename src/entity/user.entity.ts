import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('users')
export class Users {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    username: string;

    @Column({ name: 'password_hash' })
    passwordHash: string;

    @Column({ unique: true })
    email: string;

    @Column({ name: 'full_name' })
    fullName: string;

    @Column({ name:'is_admin', default: 0 })
    isAdmin: number;

    @Column({ name:'last_login', nullable: true })
    lastLogin?: string;

    @Column({ name:'created_at' })
    createdAt: string;

    @Column({ name:'failed_login_attempts', default: 0 })
    failedLoginAttempts: number;

    @Column({ name:'last_failed_attempt', nullable: true })
    lastFailedAttempt?: string;

    @Column({ name:'account_locked_until', nullable: true })
    accountLockedUntil?: string;
}

