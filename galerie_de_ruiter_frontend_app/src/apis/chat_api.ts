import axiosInstance from "@/apis/authPromise";

export type ChatResponse = { message: string; appointmentAt?: string | null; appointmentType?: string | null };

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const response = await axiosInstance.post<ChatResponse>("/api/chat", { message });
  return response.data;
}