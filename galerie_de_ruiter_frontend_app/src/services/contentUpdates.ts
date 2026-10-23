import { apiBaseUrl } from "@/apis/apiConfig";
import { invalidateCache } from "./apiCache";

export type ContentUpdateTopic =
  | "antiques"
  | "about"
  | "categories"
  | "home"
  | "location";

const updateEventName = "galerie-content-updated";
const channelName = "galerie-content-updates";

type ContentUpdate = { topic: ContentUpdateTopic };

let socket: WebSocket | undefined;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

/** Turns the API origin into the socket origin (`https` -> `wss`). */
function contentSocketUrl(): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return `${base.replace(/^http/i, "ws")}/ws/content`;
}

/**
 * One shared socket for the tab. The server sends only the topic name; this dispatches the same
 * local event a same-tab change does, so every subscriber reacts without knowing where the update
 * came from. A closed socket retries, and a browser without WebSocket support keeps working on the
 * local event and BroadcastChannel path.
 */
function ensureContentSocket(): void {
  if (socket || reconnectTimer || typeof WebSocket === "undefined") return;
  try {
    const next = new WebSocket(contentSocketUrl());
    socket = next;
    next.onmessage = (event) => {
      try {
        const update = JSON.parse(String(event.data)) as ContentUpdate;
        if (update?.topic) window.dispatchEvent(new CustomEvent<ContentUpdate>(updateEventName, { detail: update }));
      } catch {
        // A malformed frame is ignored; the next update still arrives.
      }
    };
    next.onclose = () => {
      socket = undefined;
      reconnectTimer = setTimeout(() => { reconnectTimer = undefined; ensureContentSocket(); }, 5000);
    };
    next.onerror = () => next.close();
  } catch {
    socket = undefined;
  }
}

export function publishContentUpdate(topic: ContentUpdateTopic): void {
  // The cached read for this topic is stale the moment the gallery changes it, so the
  // next page visit fetches fresh copy instead of showing what the cache held.
  invalidateCache(topic);
  const update: ContentUpdate = { topic };
  window.dispatchEvent(new CustomEvent<ContentUpdate>(updateEventName, { detail: update }));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(channelName);
    channel.postMessage(update);
    channel.close();
  }
}

export function subscribeToContentUpdates(
  topic: ContentUpdateTopic,
  callback: () => void,
): () => void {
  ensureContentSocket();
  const handleUpdate = (event: Event) => {
    const update = (event as CustomEvent<ContentUpdate>).detail;
    if (update?.topic === topic) callback();
  };
  window.addEventListener(updateEventName, handleUpdate);

  if (typeof BroadcastChannel === "undefined") {
    return () => window.removeEventListener(updateEventName, handleUpdate);
  }

  const channel = new BroadcastChannel(channelName);
  channel.onmessage = (event: MessageEvent<ContentUpdate>) => {
    if (event.data?.topic === topic) callback();
  };
  return () => {
    window.removeEventListener(updateEventName, handleUpdate);
    channel.close();
  };
}
