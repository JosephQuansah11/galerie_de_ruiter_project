import type { Category } from "@/models/antiques/Antique";
import { csrfHeaders } from "@/apis/client";
import { axiosInstance, backendBaseURL } from "./backendClient";
import { cachedRequest, invalidateCache } from "@/services/apiCache";

export async function getVisibleCategories(): Promise<Category[]> {
  return cachedRequest("categories:visible", async () =>
    (await axiosInstance.get<Category[]>(`${backendBaseURL}/api/categories`)).data);
}
export async function getAllCategories(): Promise<Category[]> {
  return cachedRequest("categories:all", async () =>
    (await axiosInstance.get<Category[]>(`${backendBaseURL}/api/categories/admin`)).data);
}
export async function updateCategory(category: Category): Promise<Category> {
  const data = (await axiosInstance.put<Category>(`${backendBaseURL}/api/categories/${category.id}`, {
    name: category.name, parentId: category.parentId ?? null, visible: category.visible,
  }, { headers: await csrfHeaders() })).data;
  invalidateCache("categories");
  return data;
}
export async function createCategory(name: string, parentId?: string): Promise<Category> {
  const data = (await axiosInstance.post<Category>(`${backendBaseURL}/api/categories`, {
    name, parentId: parentId || null, visible: true,
  }, { headers: await csrfHeaders() })).data;
  invalidateCache("categories");
  return data;
}
export async function deleteCategory(id: string): Promise<void> {
  await axiosInstance.delete(`${backendBaseURL}/api/categories/${id}`, { headers: await csrfHeaders() });
  invalidateCache("categories");
}
