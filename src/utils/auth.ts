import { AuthConfig } from "../interfaces/auth.interface";
import { Users } from "../entity/user.entity";


export class AuthUtils {
    private static failedAttempts: Map<string, number> = new Map();
    private static blockedUsers: Map<string, Date> = new Map();

    // Block duration
    private static readonly BLOCK_DURATION_MINUTES = 15;

    static handleFailedLogin(username: string, authConfig: AuthConfig): void {
        const currentAttempts = this.failedAttempts.get(username) || 0;
        const newAttempts = currentAttempts + 1;

        this.failedAttempts.set(username, newAttempts);

        // Block user afater max attempts
        if (newAttempts >= authConfig.maxLoginAttempts) {
            const blockedTime = new Date(Date.now() + this.BLOCK_DURATION_MINUTES * 60 * 1000);
            this.blockedUsers.set(username, blockedTime);

            // Clear failed attempts since user is now blocked
            this.failedAttempts.delete(username);

            console.log(`User ${username} has been blocked until ${blockedTime}`);
        }
    }

    static isUserBlocked(username: string): boolean {
        const blockedTime = this.blockedUsers.get(username);

        if (!blockedTime) {
            return false;
        }

        // Check if block period has expired
        if (Date.now() > blockedTime.getTime()) {
            this.blockedUsers.delete(username);
            return false;
        }

        return true;
    }

    static clearFailedAttempts(username: string): void {
        this.failedAttempts.delete(username);
        this.blockedUsers.delete(username)
    }

    static getRemainingBlockTime(username: string): number {
        const blockEndTime = this.blockedUsers.get(username);

        if (!blockEndTime) {
            return 0;
        }

        const remainingMs = blockEndTime.getTime() - Date.now();
        return Math.ceil(remainingMs / (1000 * 60));
    }

    static sanitizeUser(user: Users): Partial<Users> {
        const {passwordHash, ...userWithoutPassword} = user;
        return userWithoutPassword
    }
}