
import axiosInstance from '@/apis/authPromise';
import Antique, { AntiqueForm, Category } from '@/models/antiques/Antique';

export type StoreLocation = {
    id: string;
    address: string;
    openingHours: string;
    latitude: number;
    longitude: number;
};

const backendBaseURL = import.meta.env.VITE_JAVA_BACKEND_URL ?? "http://localhost:8080";


export const getAllAntiques = async (): Promise<Antique[]> => {
    const response = await axiosInstance.get<Antique[] | { content?: Antique[]; antiques?: Antique[]; data?: Antique[] }>(`${backendBaseURL}/api/antiques`);
    const payload = response.data;
    if (Array.isArray(payload)) return payload;
    return payload.content ?? payload.antiques ?? payload.data ?? [];
}

export const addAntique = async (antique: AntiqueForm): Promise<Antique> => {
    const response = await axiosInstance.post<Antique>(`${backendBaseURL}/api/antiques`, antique);
    return response.data;
}

export const uploadAntiqueImage = async (id: string, image: File): Promise<void> => {
    const body = new FormData();
    body.append("image", image);
    await axiosInstance.put(`${backendBaseURL}/api/antiques/${id}/image`, body, { headers: { "Content-Type": "multipart/form-data" } });
};

export const getVisibleCategories = async (): Promise<Category[]> => {
    const response = await axiosInstance.get<Category[]>(`${backendBaseURL}/api/categories`);
    return response.data;
}

export const getAllCategories = async (): Promise<Category[]> => {
    const response = await axiosInstance.get<Category[]>(`${backendBaseURL}/api/categories/admin`);
    return response.data;
}

export const updateCategory = async (category: Category): Promise<Category> => {
    const response = await axiosInstance.put<Category>(`${backendBaseURL}/api/categories/${category.id}`, {
        name: category.name,
        parentId: category.parentId ?? null,
        visible: category.visible,
    });
    return response.data;
}

export const createCategory = async (name: string, parentId?: string): Promise<Category> => {
    const response = await axiosInstance.post<Category>(`${backendBaseURL}/api/categories`, { name, parentId: parentId || null, visible: true });
    return response.data;
};

export const deleteCategory = async (id: string): Promise<void> => {
    await axiosInstance.delete(`${backendBaseURL}/api/categories/${id}`);
};

export const getStoreLocation = async (): Promise<StoreLocation> => {
    const response = await axiosInstance.get<StoreLocation>(`${backendBaseURL}/api/location`);
    return response.data;
};

export const updateStoreLocation = async (location: Omit<StoreLocation, "id">): Promise<StoreLocation> => {
    const response = await axiosInstance.put<StoreLocation>(`${backendBaseURL}/api/location`, location);
    return response.data;
};

export const createCheckoutSession = async (items: Array<{ antiqueId: string; quantity: number }>): Promise<string> => {
    const response = await axiosInstance.post<{ checkoutUrl: string }>(`${backendBaseURL}/api/checkout`, { items });
    return response.data.checkoutUrl;
};