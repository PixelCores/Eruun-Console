export type ModelType = 'LLM' | 'Vision' | 'Audio' | 'Embedding';

export interface Model {
    id: string;
    title: string;
    description: string;
    type: ModelType;
    icon: string; // Store icon name string
    color: string;
    bgColor: string;
    provider: string;
    stars: number;
    downloads: string;
}

export interface ModelListResponse {
    data: Model[];
    total: number;
}
