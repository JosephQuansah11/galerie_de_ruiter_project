import type { Category } from "@/models/antiques/Antique";
import { csrfHeaders } from "@/apis/client";
import { axiosInstance, backendBaseURL } from "./backendClient";

export async function getVisibleCategories(): Promise<Category[]> {
  return (await axiosInstance.get<Category[]>(`${backendBaseURL}/api/categories`)).data;
}
export async function getAllCategories(): Promise<Category[]> {
  return (await axiosInstance.get<Category[]>(`${backendBaseURL}/api/categories/admin`)).data;
}
export async function updateCategory(category: Category): Promise<Category> {
  return (await axiosInstance.put<Category>(`${backendBaseURL}/api/categories/${category.id}`, {
    name: category.name, parentId: category.parentId ?? null, visible: category.visible,
  }, { headers: await csrfHeaders() })).data;
}
export async function createCategory(name: string, parentId?: string): Promise<Category> {
  return (await axiosInstance.post<Category>(`${backendBaseURL}/api/categories`, {
    name, parentId: parentId || null, visible: true,
  }, { headers: await csrfHeaders() })).data;
}
export async function deleteCategory(id: string): Promise<void> {
  await axiosInstance.delete(`${backendBaseURL}/api/categories/${id}`, { headers: await csrfHeaders() });
}
