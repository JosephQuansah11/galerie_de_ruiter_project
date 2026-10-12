import axiosInstance from "@/apis/authPromise";
import { apiBaseUrl } from "@/apis/apiConfig";

/**
 * The shared API client aborts a request after 15 seconds. A CPU-hosted model needs much longer to
 * answer, so the chat calls set their own window. Without this the POST to `/api/chat` was aborted
 * by the 15s default while the fast `/api/chat/status` probe kept reporting "ready" — the browser
 * showed the reply request as cancelled even though the assistant was up.
 */
const CHAT_REPLY_TIMEOUT_MS = 180000;
const CHAT_WARMUP_TIMEOUT_MS = 120000;

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

/**
 * Loads the model into memory for the current session when the visitor opens the chat
 * page. The backend keeps it resident, so the connection lasts as long as the visitor
 * stays on the page instead of being rebuilt on every prompt.
 */
export async function warmUpChat(): Promise<ChatStatus> {
  const response = await axiosInstance.post<ChatStatus>(`${apiBaseUrl}/api/chat/warmup`, undefined, { timeout: CHAT_WARMUP_TIMEOUT_MS });
  return response.data;
}

export async function sendChatMessage(
  message: string,
  history: ChatHistoryMessage[] = [],
  appointmentSelection?: ChatAppointmentSelection,
): Promise<ChatResponse> {
  const response = await axiosInstance.post<ChatResponse>(`${apiBaseUrl}/api/chat`,
    { message, history, appointmentSelection }, { timeout: CHAT_REPLY_TIMEOUT_MS });
  return response.data;
}