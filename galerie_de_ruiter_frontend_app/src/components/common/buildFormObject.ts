export function buildFormObject<T extends Record<string, unknown>>(
  formData: FormData,
  template: T,
  prefix = "",
): T {
  const result: Record<string, unknown> = {};
  Object.entries(template).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    result[key] = value && typeof value === "object" && !Array.isArray(value)
      ? buildFormObject(formData, value as Record<string, unknown>, path)
      : formData.get(path) ?? formData.get(key) ?? "";
  });
  return result as T;
}
