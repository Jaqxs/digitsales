import { User, LoginCredentials, AuthResponse } from '@/lib/api/auth';

const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    AUTH_USER: 'auth_user',
};

// Mock Users
const MOCK_USERS: User[] = [
    {
        id: 'u1',
        email: 'admin@zantrix.co.tz',
        role: 'admin',
        isActive: true,
        lastLoginAt: new Date().toISOString(),
        profile: {
            firstName: 'System',
            lastName: 'Admin',
            phone: '+255 700 000 001',
            avatarUrl: null,
            employeeId: 'ADMIN-001',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'u2',
        email: 'manager@zantrix.co.tz',
        role: 'manager',
        isActive: true,
        lastLoginAt: new Date().toISOString(),
        profile: {
            firstName: 'Store',
            lastName: 'Manager',
            phone: '+255 700 000 002',
            avatarUrl: null,
            employeeId: 'MGR-001',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'u3',
        email: 'sales@zantrix.co.tz',
        role: 'sales',
        isActive: true,
        lastLoginAt: new Date().toISOString(),
        profile: {
            firstName: 'Sales',
            lastName: 'Rep',
            phone: '+255 700 000 003',
            avatarUrl: null,
            employeeId: 'SALES-001',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

// Mock Passwords (in a real app, these would be hashed on the server)
const MOCK_PASSWORDS: Record<string, string> = {
    'admin@zantrix.co.tz': 'admin123',
    'manager@zantrix.co.tz': 'manager123',
    'sales@zantrix.co.tz': 'sales123',
};

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class LocalAuthService {
    static async login(credentials: LoginCredentials): Promise<AuthResponse> {
        await delay(500); // Simulate network request

        const { email, password } = credentials;
        const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (user && MOCK_PASSWORDS[user.email] === password) {
            if (!user.isActive) {
                throw new Error('Account is deactivated');
            }

            const token = `mock_token_${crypto.randomUUID()}`;

            // Update last login
            const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };

            // Persist session
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
            localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updatedUser));

            return {
                user: updatedUser,
                tokens: {
                    accessToken: token,
                    refreshToken: `mock_refresh_${crypto.randomUUID()}`
                }
            };
        }

        throw new Error('Invalid email or password');
    }

    static async getCurrentUser(): Promise<User> {
        await delay(200);
        const userJson = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
        if (!userJson) throw new Error('No active session');
        return JSON.parse(userJson);
    }

    static logout(): void {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }

    static isAuthenticated(): boolean {
        return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }
}
