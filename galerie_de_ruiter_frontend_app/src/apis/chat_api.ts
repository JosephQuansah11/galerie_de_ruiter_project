import axiosInstance from "@/apis/authPromise";
import { apiBaseUrl } from "@/apis/apiConfig";

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
export type ChatStatus = { ready: boolean; model: string; detail: string };

/**
 * Confirms that the gallery assistant model connection is established before any
 * prompt is sent from the chat interface.
 */
export async function fetchChatStatus(): Promise<ChatStatus> {
  const response = await axiosInstance.get<ChatStatus>(`${apiBaseUrl}/api/chat/status`, { timeout: 20000 });
  return response.data;
}

export async function sendChatMessage(
  message: string,
  history: ChatHistoryMessage[] = [],
  appointmentSelection?: ChatAppointmentSelection,
): Promise<ChatResponse> {
  const response = await axiosInstance.post<ChatResponse>(`${apiBaseUrl}/api/chat`, { message, history, appointmentSelection });
  return response.data;
}