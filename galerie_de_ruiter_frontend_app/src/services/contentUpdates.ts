export type ContentUpdateTopic =
  | "antiques"
  | "about"
  | "categories"
  | "home"
  | "location";

const updateEventName = "galerie-content-updated";
const channelName = "galerie-content-updates";

type ContentUpdate = { topic: ContentUpdateTopic };

export function publishContentUpdate(topic: ContentUpdateTopic): void {
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
