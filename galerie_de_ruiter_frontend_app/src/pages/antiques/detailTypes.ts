export type Position = "front" | "back" | "left" | "right" | "top" | "bottom";
export const positions: Position[] = ["front", "back", "left", "right", "top", "bottom"];
export type Translate = (key: string, options?: Record<string, unknown>) => string;
