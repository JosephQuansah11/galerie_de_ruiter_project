import axiosInstance from "@/apis/authPromise";

export type ChatResponse = { message: string; appointmentAt?: string | null; appointmentType?: string | null };


export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const baseURL = import.meta.env.VITE_JAVA_API_URL ?? "http://localhost:8080";
  const response = await axiosInstance.post<ChatResponse>(`${baseURL}/api/chat`, { message });
  return response.data;
}