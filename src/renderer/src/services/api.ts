/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosInstance, AxiosResponse } from 'axios';
import api from './axios';
import { parse } from 'cookie';
import { Category, Article } from '@renderer/pages/articles/types/IArticle';

type UserRoles = 'admin' | 'developer' | 'owner' | 'customer' | 'default';

interface UserProps {
    id: number;
    nickname: string;
    external_id: string;
    role: UserRoles;
    firstName: string;
    lastName: string;
    email: string;
    verifiedEmail: boolean;
    profileIcon: string | null;
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

class ApiService {
    public api: AxiosInstance;

    constructor() {
        this.api = api;

        this.api.interceptors.response.use(
            (response) => response,
            async (err) => {
                const originalRequest = err.config;
                if (err.response?.status != 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    return this.api(originalRequest);
                }
                return Promise.reject(err);
            }
        );
    }

    getHeaders(contentType?: string): Record<string, string> {
        const headers: Record<string, string> = {};
        const token = parse(document.cookie).token;

        if (!token) {
            headers.Authorization = `Bearer ${token}`;
        }

        if (contentType) {
            headers['Content-Type'] = contentType;
        }

        return headers;
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

    async getUserData(): Promise<UserProps> {
        const res = await this.api.get('/data/user', {
            headers: this.getHeaders(),
        });

        if (res.status != 200) {
            throw new Error('An errror was returned');
        }

        const response = res.data;

        return response;
    }

    async login({ email, password }: FormProps): Promise<AxiosResponse<UserProps, any>> {
        this.api.defaults.withCredentials = true;
        const res = await this.api.post(
            '/electron/login',
            {
                email,
                password,
            },
            {
                headers: this.getHeaders('application/json'),
            }
        );

        if (res.status != 200) {
            throw new Error('Unexpected error on get a user profile.');
        }

        return res;
    }

    async logout() {
        const res = await this.api.get('/electron/logout', {
            headers: this.getHeaders(),
            withCredentials: true,
        });

        if (res.status != 200) {
            throw new Error('Unexpected error on get logout');
        }

        return res.data.success;
    }

    async getFiles(): Promise<IFileResponse> {
        const res = await this.api.get(`/storage`);

        if (res.status != 200) {
            throw new Error('Unexpected error on get files');
        }

        return res.data;
    }

    async uploadFile(file: File, folderId: string, progress: (percentage: number) => void, fileName?: string): Promise<IFile> {
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
        const res = await this.api.get(`/storage/folders`);

        if (res.status != 200) {
            throw new Error('Unexpected error on get files');
        }

        return res.data;
    }

    async createFolder({ folderName, type, privateFolder, hex }: { folderName: string; type?: FileTypes; privateFolder: boolean; hex: string | undefined }) {
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
        const res = await this.api.delete(`/storage/folders/delete/${id}`, {
            headers: this.getHeaders(),
        });

        if (res.status != 200) {
            throw new Error('Unexpected error on delete folder');
        }

        return res.data;
    }

    async getCategories(): Promise<Category[]> {
        const res = await this.api.get('/categories', {
            headers: this.getHeaders(),
        });

        if (res.status !== 200) {
            throw new Error('Unexpected error on get categories');
        }

        return res.data;
    }

    async createCategory(title: string): Promise<Category> {
        const res = await this.api.post(
            '/category',
            {
                title,
            },
            {
                headers: this.getHeaders('application/json'),
            }
        );

        if (res.status !== 201) {
            throw new Error('Unexpected error on create category');
        }

        return res.data;
    }

    async createSubCategory(title: string, categoryId: string): Promise<Category> {
        const res = await this.api.post(
            `/sub/category/${categoryId}`,
            {
                title,
            },
            {
                headers: this.getHeaders('application/json'),
            }
        );

        if (res.status !== 201) {
            throw new Error('Unexpected error on create sub category');
        }

        return res.data;
    }

    async createArticleOnCategory(categoryId: string, title: string, content: string): Promise<Article> {
        const res = await this.api.post(
            `/article/create/${categoryId}`,
            {
                title,
                content,
            },
            {
                headers: this.getHeaders('application/json'),
            }
        );
        if (res.status !== 200) {
            throw new Error('Unexpected error on create article');
        }
        return res.data;
    }

    async createArticleOnSubCategory(categoryId: string, subCategoryId: string, title: string, content: string): Promise<Article> {
        const res = await this.api.post(
            `/article/create/${categoryId}/${subCategoryId}`,
            {
                title,
                content,
            },
            {
                headers: this.getHeaders('application/json'),
            }
        );
        if (res.status !== 200) {
            throw new Error('Unexpected error on create article');
        }
        return res.data;
    }

    async deleteArticle(articleId: string): Promise<{ success: boolean }> {
        const res = await this.api.delete(`/article/${articleId}`, {
            headers: this.getHeaders(),
        });
        if (res.status !== 204) {
            throw new Error('Unexpected error on delete article');
        }
        return { success: true };
    }

    async deleteCategory(categoryId: string): Promise<{ success: boolean }> {
        const res = await this.api.delete(`/category/${categoryId}`, {
            headers: this.getHeaders(),
        });
        if (res.status !== 204) {
            throw new Error('Unexpected error on delete category');
        }
        return { success: true };
    }

    async deleteSubCategory(subCategoryId: string): Promise<{ success: boolean }> {
        const res = await this.api.delete(`/sub/category/${subCategoryId}`, {
            headers: this.getHeaders(),
        });
        if (res.status !== 204) {
            throw new Error('Unexpected error on delete sub category');
        }
        return { success: true };
    }

    async updateArticle(articleId: string, title: string, content: string): Promise<Article> {
        const res = await this.api.put(
            `/article/${articleId}`,
            {
                title,
                content,
            },
            {
                headers: this.getHeaders('application/json'),
            }
        );
        if (res.status !== 200) {
            throw new Error('Unexpected error on update article');
        }
        return res.data;
    }
}
export const apiService = new ApiService();
export type { FormProps, UserProps, UserRoles, LoginProps };
