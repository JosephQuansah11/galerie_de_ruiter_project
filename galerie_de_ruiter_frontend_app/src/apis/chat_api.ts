import axiosInstance from "@/apis/authPromise";

export type ChatHistoryMessage = { role: "user" | "assistant"; text: string };
export type ChatAppointmentSelection = { at: string; type: "VISIT" | "ONLINE" };
export type ChatSource = { title: string; url: string };
export type ChatResponse = {
  message: string;
  appointmentAt?: string | null;
  appointmentType?: string | null;
  appointmentConfirmed: boolean;
  appointmentHandoffRequired: boolean;
  sources: ChatSource[];
};

export async function sendChatMessage(
  message: string,
  history: ChatHistoryMessage[] = [],
  appointmentSelection?: ChatAppointmentSelection,
): Promise<ChatResponse> {
  const baseURL = import.meta.env.VITE_JAVA_API_URL ?? "http://localhost:8080";
  const response = await axiosInstance.post<ChatResponse>(`${baseURL}/api/chat`, { message, history, appointmentSelection });
  return response.data;
}