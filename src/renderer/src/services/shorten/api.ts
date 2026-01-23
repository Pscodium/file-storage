/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosInstance } from 'axios';
import api from './axios';
import { parse } from 'cookie';

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

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        if (contentType) {
            headers['Content-Type'] = contentType;
        }

        console.log('os headers ', headers);
        console.log('token ', token);
        return headers;
    }

    async shortenUrl(url: string): Promise<{ shortUrl: string }> {
        const res = await this.api.post(
            '/shorten',
            { url },
            {
                headers: this.getHeaders(),
            }
        );

        if (res.status != 200) {
            throw new Error('Unexpected error on get shortenUrl');
        }

        return res.data;
    }

    async getShortenedUrls(params: Record<string, any>): Promise<ShortenedLinkResponse> {
        const res = await this.api.get('/user/urls', {
            headers: this.getHeaders('application/json'),
            params,
        });

        if (res.status != 200) {
            throw new Error('Unexpected error on get shortened URLs');
        }

        return res.data;
    }

    async deleteUserUrl(code: string): Promise<void> {
        const res = await this.api.delete(`/user/url/${code}`, {
            headers: this.getHeaders(),
        });

        if (res.status != 204) {
            throw new Error('Unexpected error on get shortened URLs');
        }

        return res.data;
    }
}

export const shortenService = new ApiService();
