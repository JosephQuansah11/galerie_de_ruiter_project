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
/**
 * Sends a message to the gallery assistant and returns its answer.
 *
 * The answer used to come from a language model on a private Ollama service, and this call carried a
 * three-minute timeout for it: a CPU-hosted model needed that long, and the shared 15-second window
 * aborted the request while the fast status probe kept reporting the assistant was up. The assistant
 * now answers from the gallery's own records - the location and the opening hours, the size of the
 * collection, and the appointment request - so a reply is a database read and the shared timeout is
 * generous for it.
 *
 * `language` is the visitor's, so the reply comes back in it.
 */
export async function sendChatMessage(
  message: string,
  history: ChatHistoryMessage[] = [],
  appointmentSelection?: ChatAppointmentSelection,
  language?: string,
): Promise<ChatResponse> {
  const response = await axiosInstance.post<ChatResponse>(`${apiBaseUrl}/api/chat`,
    { message, history, appointmentSelection, language });
  return response.data;
}