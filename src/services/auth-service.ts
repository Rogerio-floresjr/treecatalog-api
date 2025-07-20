import { AuthConfig, IPasswordService, ITokenService, LoginRequest, PasswordResetRequest } from "../interfaces/auth.interface";
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken'
import { Users } from "../entity/user.entity";
import { Repository } from "typeorm";
import { AuthUtils } from "../utils/auth";

// Internal PasswordService implementation
class PasswordService implements IPasswordService {
    private saltRounds: number;

    constructor(saltRounds: number = 10) {
        this.saltRounds = saltRounds;
    }

    // Hash password
    async hashPassword(password: string): Promise<string> {
        try {
            const salt = await bcrypt.genSalt(this.saltRounds);
            const hashedPassword = await bcrypt.hash(password, salt);
            return hashedPassword;
        }catch (error) {
            console.error('Error hashing password:', error);
            throw new Error('Password hashing failed')
        }
    }

    // Compare password
    async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        try {
            const isMatch = await bcrypt.compare(password, hashedPassword);
            return isMatch
        }catch (error) {
            console.error('Error comparing passwords:', error);
            throw new Error('Password comparison failed');
        }
    }
}

// Internal Token Service implementation
class TokenService implements ITokenService {
    private jwtSecret: string;
    private jwtExpiration: string;

    constructor(authConfig: AuthConfig) {
        this.jwtSecret = authConfig.jwtSecret
        this.jwtExpiration = authConfig.jwtExpiration
    }

    generateToken(user: Users): string {
        try {
            const payload = {
                id: user.id,
                username: user.username,
                email: user.email,
                fullname: user.fullName,
                isAdmin: user.isAdmin,
            };

            const token = jwt.sign(payload, this.jwtSecret, {expiresIn: '24h' });
            return token;
        }catch (error) {
            console.error('Error generating token:', error);
            throw new Error('Token generation failed')
        }
    }

    generateTokenRefresh(user: Users): string {
        try {
            const payload = {
                id: user.id,
                username: user.username,
                type: 'refresh'
            };
            
            const refreshToken = jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });
            return refreshToken;
        }catch (error) {

        }
    }

    verifyToken(token: string) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            return decoded;
        }catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Token has expired');
            }else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid token');
            }else {
                console.error('Error verifying token:', error);
                throw new Error('Token verification failed');
            }
        }
    }

    decodeToken(token: string) {
        try {
            const decoded = jwt.decode(token);
            return decoded;
        }catch (error) {
            console.error('Error decoding token:', error);
            throw new Error('Token decoding failed');
        }
    }

    extractTokenFormHeader(authHeader: string): string | null {
        if (!authHeader) {
            return null;
        }

        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }

        return parts[1];
    }
}

export class AuthService {
    private userRepository: Repository<Users>;
    private passwordService: IPasswordService;
    private tokenService: ITokenService;
    private authConfig: AuthConfig

    constructor(
        userRepository: Repository<Users>,
        authConfig: AuthConfig
    ) {
        this.userRepository = userRepository;
        this.authConfig = authConfig;

        // Initialize internal services
        this.passwordService = new PasswordService(authConfig.saltRounds);
        this.tokenService = new TokenService(authConfig)
    }

    // Function to register User
    async registerUser(data: Partial<Users>): Promise<{
        success: boolean,
        message: string,
        user?: Partial<Users>
    }> {
        try {
            // Validate required fields
            if (!data.username || !data.passwordHash || !data.fullName || !data.email) {
                return { success: false, message: 'Username, passowrd, name and email are required' }
            }

            // Check if username and email already exists
            const existingUserByUsername = await this.userRepository.findOne({
                where: { username: data.username}
            })

            if (existingUserByUsername) {
                return { success: false, message: 'Username already exists' };
            }

            const existingUserByEmail = await this.userRepository.findOne({
                where: { email: data.email }
            })

            if (existingUserByEmail) {
                return { success: false, message: 'Email already exists' }
            }

            // Hash password
            const hashedPassword = await this.passwordService.hashPassword(data.passwordHash);

            const currentTimestamp = new Date().toISOString();

            // Register user
            const newUser = this.userRepository.create({
                username: data.username,
                passwordHash: hashedPassword,
                email: data.email,
                fullName: data.fullName,
                createdAt: currentTimestamp
            });
            
            const savedUser = await this.userRepository.save(newUser);

            // Remove password from response
            const { passwordHash, ...userWithoutPassword } = savedUser;

            return {
                success: true,
                message: 'User registered successfully',
                user: userWithoutPassword
            };
        }catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Registration failed. Please try again' }
        }
    }

    // Function to sign in
    async login(loginData: LoginRequest): Promise<{
        success: boolean,
        message: string,
        token?: string,
        refreshToken?: string,
        user?: Partial<Users>
    }> {
        try {
            // Check if user is currently blocked
            if (AuthUtils.isUserBlocked(loginData.username)) {
                const remainingTime = AuthUtils.getRemainingBlockTime(loginData.username);
                return { 
                    success: false, 
                    message: `Account is temporarily blocked. Try again in ${remainingTime} minutes.` 
                };
            }

            const user = await this.userRepository.findOne({
                where: { username: loginData.username }
            })

            if (!user) {
                AuthUtils.handleFailedLogin(loginData.username, this.authConfig);
                return { success: false, message: 'Invalid username or password' };
            }

            // Verify password
            const isPasswordValid = await this.passwordService.comparePassword(
                loginData.password,
                user.passwordHash
            );

            if (!isPasswordValid) {
                AuthUtils.handleFailedLogin(loginData.username, this.authConfig);
                return { success: false, message: 'Invalid username or password' };
            }

            // Successful login - clear failed attempts
            AuthUtils.clearFailedAttempts(loginData.username);

            // Update last login and save user
            user.lastLogin = new Date().toISOString();
            user.failedLoginAttempts = 0;
            user.lastFailedAttempt = null;
            user.accountLockedUntil = null;
            await this.userRepository.save(user);

            // Tokens
            const token = this.tokenService.generateToken(user);
            const refreshToken = this.tokenService.generateTokenRefresh(user);

            // Remove password from response
            const { passwordHash, ...userWithoutPassword } = user;

            return {
                success: true,
                message: 'Login successful',
                token,
                refreshToken,
                user: userWithoutPassword
            };

        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed. Please try again' };
        }
    }

    // Function to reset password
    async resetPassword(resetData: PasswordResetRequest): Promise<{ success: boolean, message: string}> {
        try {
            if (resetData.newPassword !== resetData.confirmNewPassword) {
                return { success: false, message: 'Passwords do not match' };
            }

            const user = await this.userRepository.findOne({
                where: { username: resetData.username }
            });

            if (!user) {
                return { success: false, message: 'User not found' };
            }

            // Hash new password
            const hashedPassword = await this.passwordService.hashPassword(resetData.newPassword);

            // Update user password
            user.passwordHash = hashedPassword;
            await this.userRepository.save(user);

            // Clear any failed attempts
            AuthUtils.clearFailedAttempts(resetData.username);

            return { success: true, message: 'Password reset successfully' };
        }catch (error) {
            console.error('Password reset error:', error);
            return { success: false, message: 'Password reset failed' };
        }
    }
    
    async verifyToken(token: string): Promise<any> {
        return this.tokenService.verifyToken(token)
    }
}