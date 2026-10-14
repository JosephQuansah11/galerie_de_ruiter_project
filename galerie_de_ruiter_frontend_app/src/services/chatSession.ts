/**
 * Persistence for the concierge chat.
 *
 * The chat used to live entirely in the page component, so walking to another page and
 * back started a brand-new conversation. The session is now written to `localStorage`
 * and restored when the visitor returns, which keeps one conversation open for the whole
 * visit. It is cleared on sign-out (see `AuthContext.logout`), so the next person to use
 * the browser starts fresh.
 */

export type ChatSessionSource = { title: string; url: string };

export type ChatSessionMessage = {
  role: "user" | "assistant";
  text: string;
  translationKey?: string;
  sources?: ChatSessionSource[];
};

export type ChatSessionAppointment = { at: string; type: "VISIT" | "ONLINE" };

export type ChatSession = {
  messages: ChatSessionMessage[];
  appointment?: ChatSessionAppointment;
};

const STORAGE_KEY = "galerie-chat-session";

function storageAvailable(): boolean {
  return typeof localStorage !== "undefined";
}

/** Reads the stored conversation, ignoring anything malformed. */
export function readChatSession(): ChatSession | undefined {
  if (!storageAvailable()) return undefined;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<ChatSession>;
    if (!Array.isArray(parsed.messages)) return undefined;
    const messages = parsed.messages.filter(
      (message): message is ChatSessionMessage =>
        !!message && (message.role === "user" || message.role === "assistant") && typeof message.text === "string",
    );
    return { messages, appointment: parsed.appointment };
  } catch {
    return undefined;
  }
}

/** Writes the current conversation so it survives navigation and a page refresh. */
export function writeChatSession(session: ChatSession): void {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // A full or disabled storage must never break the chat itself.
  }
}

/** Ends the stored conversation. Called when the visitor signs out. */
export function clearChatSession(): void {
  if (!storageAvailable()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
