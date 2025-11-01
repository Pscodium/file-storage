/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Article {
    id: string;
    title: string;
    content?: string;
    files?: any;
    createdAt?: string;
    updatedAt?: string;
    UserId?: string;
    category?: string;
    subcategory?: string;
    order?: number;
}

export interface ArticleGroup {
    id: string;
    title: string;
    count?: number;
    views?: number;
    hex?: string;
    createdAt?: string;
    updatedAt?: string;
    articlesCount?: number;
    Articles: Article[];
}

export interface Subcategory {
    id: string;
    title: string;
    hex?: string;
    articles: Article[];
}

export interface Category {
    id: string;
    title: string;
    hex?: string;
    createdAt?: string;
    updatedAt?: string;
    subCategories: Subcategory[];
    articles?: Article[];
}
