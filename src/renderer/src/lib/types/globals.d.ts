
interface IArticle {
    id: string;
    title: string;
    body: string;
    files?: object | null;
    createdAt: Date;
    updatedAt: Date;
    Tags?: ITagResponse
}

interface ITag {
    id: string;
    title: string;
    count: number;
    views: number;
    hex: string;
    articlesCount: number;
    createdAt: Date;
    updatedAt: Date;
}

interface IFile {
    id: string;
    name: string;
    type?: string;
    private?: boolean;
    url: string;
    createdAt: Date;
    updatedAt: Date;
}


interface IFolder {
    id: string;
    name: string;
    type?: FileTypes;
    hex: string;
    filesCount: number;
    private?: boolean;
    Files?: IFileResponse;
    createdAt: Date;
    updatedAt: Date;
}

type IFolderResponse = IFolder[];
type IFileResponse = IFile[];
type ITagResponse = ITag[];
type IArticleResponse = IArticle[];

type FileTypes = "image/*" | "audio/*" | "video/*";