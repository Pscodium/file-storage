/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance } from 'axios';
import api from './axios';

interface UserProps {
    userId: string;
    roles: string[];
    clientId: string;
}

interface FormProps {
    nickname?: string;
    email?: string;
    password?: string;
}

interface LoginProps {
    email: string;
    password: string;
}

interface AuthTokens {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}

interface LoginResponse {
    code: string;
}

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_ENDPOINT || 'http://localhost:3000';
const CLIENT_ID = 'file-storage';
const REDIRECT_URI = import.meta.env.VITE_NODE_ENV === 'development' ? 'http://localhost:5173/callback' : 'ocs-auth://callback';
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const authApi = axios.create({
    baseURL: AUTH_BASE_URL,
});

class ApiService {
    public api: AxiosInstance;

    constructor() {
        this.api = api;

        this.api.interceptors.response.use(
            (response) => response,
            async (err) => {
                const originalRequest = err.config;
                if (err.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    const refreshed = await this.refreshToken();
                    if (refreshed?.access_token) {
                        originalRequest.headers = {
                            ...(originalRequest.headers || {}),
                            Authorization: `Bearer ${refreshed.access_token}`,
                        };
                        return this.api(originalRequest);
                    }
                }
                return Promise.reject(err);
            }
        );
    }

    getHeaders(contentType?: string): Record<string, string> {
        const headers: Record<string, string> = {};
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        if (contentType) {
            headers['Content-Type'] = contentType;
        }

        return headers;
    }

    private requireAuth(): void {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (!token) {
            throw new Error('User must be authenticated to access this resource.');
        }
    }

    private hasToken(): boolean {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);

        return token ? true : false;
    }

    async checkAuth(): Promise<UserProps> {
        const res = await this.api.get('/check/auth', {
            headers: this.getHeaders(),
        });

        if (res.status != 200) {
            throw new Error('An errror was returned');
        }

        const response = res.data;

        return response;
    }

    async login({ email, password }: LoginProps): Promise<UserProps> {
        const pkce = await this.generatePkce();

        const loginRes = await authApi.post<LoginResponse>(
            '/auth/login',
            {
                email,
                password,
                client_id: CLIENT_ID,
                redirect_uri: REDIRECT_URI,
                code_challenge: pkce.challenge,
                code_challenge_method: 'S256',
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (loginRes.status !== 200 || !loginRes.data?.code) {
            throw new Error('Unexpected error on login.');
        }

        const tokens = await this.exchangeCode(loginRes.data.code, pkce.verifier);
        if (!tokens?.access_token) {
            throw new Error('Unexpected error on token exchange.');
        }

        const user = await this.checkAuth();
        return user;
    }

    async logout() {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        if (refreshToken) {
            await authApi.post(
                '/auth/logout',
                {
                    refresh_token: refreshToken,
                    client_id: CLIENT_ID,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        this.clearTokens();
        return true;
    }

    async getFiles(): Promise<IFileResponse> {
        this.requireAuth();

        const res = await this.api.get(`/storage`, {
            headers: this.getHeaders(),
        });

        if (res.status != 200) {
            throw new Error('Unexpected error on get files');
        }

        return res.data;
    }

    async uploadFile(file: File, folderId: string, progress: (percentage: number) => void, fileName?: string): Promise<IFile> {
        this.requireAuth();

        const formData = new FormData();
        const fileNameWithoutExtention = file.name.split('.');
        fileNameWithoutExtention.pop();
        const newFileName = fileName ? `${fileName}-${Date.now()}.${file.name.split('.').pop()}` : `${fileNameWithoutExtention}-${Date.now()}.${file.name.split('.').pop()}`;
        const renamedFile = new File([file], newFileName, { type: file.type });

        formData.append('media', renamedFile);

        const res = await this.api.post(`/storage/upload/${folderId}`, formData, {
            headers: this.getHeaders(),
            responseType: 'blob',
            onUploadProgress(progressEvent) {
                if (progressEvent.total) {
                    const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    progress(percentage);
                }
            },
        });

        if (res.status != 200) {
            throw new Error('Unexpected error on create file');
        }

        return res.data;
    }

    async uploadMultipleFilesWithIds(files: File[], folderId: string, fileIds: string[], fileNames?: string[]): Promise<IFile[]> {
        this.requireAuth();

        const formData = new FormData();

        files.forEach((file, index) => {
            const extension = file.name.split('.').pop();

            let finalFileName: string;
            if (fileNames && fileNames[index]) {
                finalFileName = fileNames[index].includes(`.${extension}`) ? fileNames[index] : `${fileNames[index]}.${extension}`;
            } else {
                finalFileName = file.name;
            }

            const renamedFile = new File([file], finalFileName, { type: file.type });

            formData.append('media', renamedFile);
        });

        formData.append('fileIds', JSON.stringify(fileIds));

        try {
            const res = await this.api.post(`/storage/upload/${folderId}`, formData, {
                headers: {
                    ...this.getHeaders(),
                    'Content-Type': undefined,
                },
                withCredentials: true,
            });

            if (res.status !== 200) {
                throw new Error('Unexpected error during file upload');
            }

            return res.data;
        } catch (error) {
            console.error('Error uploading files:', error);
            throw error;
        }
    }

    async deleteFile(id: string, folderId: string): Promise<IFile> {
        this.requireAuth();

        const res = await this.api.delete(`/storage/delete/${id}/folder/${folderId}`, {
            headers: this.getHeaders(),
        });

        if (res.status != 200) {
            throw new Error('Unexpected error on delete file');
        }

        return res.data;
    }

    /**
     * Delete multiple files with WebSocket progress tracking
     * @param {string[]} fileIds IDs dos arquivos a serem excluídos
     * @param {string} folderId ID da pasta que contém os arquivos
     * @returns {Promise<{success: boolean, deletedCount: number, deletedFiles: string[]}>}
     */
    async deleteMultipleFiles(fileIds: string[], folderId: string, deleteIds?: string[]): Promise<{ success: boolean; deletedCount: number; deletedFiles: string[] }> {
        this.requireAuth();

        try {
            const res = await this.api.post(
                '/storage/delete/bulk',
                {
                    fileIds,
                    folderId,
                    deleteIds,
                },
                {
                    headers: this.getHeaders('application/json'),
                    withCredentials: true,
                }
            );

            if (res.status !== 200) {
                throw new Error('Unexpected error during file deletion');
            }

            return res.data;
        } catch (error) {
            console.error('Error deleting files:', error);
            throw error;
        }
    }

    async getFolders(): Promise<IFolderResponse> {
        const token = this.hasToken();

        const res = await this.api.get(`/storage/folders`, {
            headers: token ? this.getHeaders() : undefined,
        });

        if (res.status != 200) {
            throw new Error('Unexpected error on get files');
        }

        return res.data;
    }

    async createFolder({ folderName, type, privateFolder, hex }: { folderName: string; type?: FileTypes; privateFolder: boolean; hex: string | undefined }) {
        this.requireAuth();

        const res = await this.api.post(
            '/storage/folders/create',
            {
                folderName,
                type,
                private: privateFolder,
                hex,
            },
            {
                headers: this.getHeaders(),
            }
        );

        if (res.status != 200) {
            throw new Error('Unexpected error on get files');
        }

        return res.data;
    }

    async deleteStorageFolder(id: string) {
        this.requireAuth();

        const res = await this.api.delete(`/storage/folders/delete/${id}`, {
            headers: this.getHeaders(),
        });

        if (res.status != 200) {
            throw new Error('Unexpected error on delete folder');
        }

        return res.data;
    }

    private async exchangeCode(code: string, verifier: string): Promise<AuthTokens> {
        const res = await authApi.post<AuthTokens>(
            '/auth/token',
            {
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID,
                code_verifier: verifier,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (res.status !== 200) {
            throw new Error('Unexpected error on token exchange.');
        }

        this.storeTokens(res.data);
        return res.data;
    }

    private async refreshToken(): Promise<AuthTokens | null> {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
            return null;
        }

        try {
            const res = await authApi.post<AuthTokens>(
                '/auth/token',
                {
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: CLIENT_ID,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (res.status !== 200) {
                throw new Error('Unexpected error on refresh token.');
            }

            this.storeTokens(res.data);
            return res.data;
        } catch (error) {
            this.clearTokens();
            return null;
        }
    }

    private storeTokens(tokens: AuthTokens) {
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    }

    private clearTokens() {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    private async generatePkce(): Promise<{ verifier: string; challenge: string }> {
        const verifier = this.randomBase64Url(32);
        const challenge = await this.sha256Base64Url(verifier);
        return { verifier, challenge };
    }

    private randomBase64Url(length: number): string {
        const randomBytes = new Uint8Array(length);
        globalThis.crypto.getRandomValues(randomBytes);
        return this.base64UrlEncode(randomBytes);
    }

    private async sha256Base64Url(value: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(value);
        const hash = await globalThis.crypto.subtle.digest('SHA-256', data);
        return this.base64UrlEncode(new Uint8Array(hash));
    }

    private base64UrlEncode(bytes: Uint8Array): string {
        const base64 = btoa(String.fromCharCode(...bytes));
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    }
}

export const apiService = new ApiService();
export type { FormProps, LoginProps, UserProps };
