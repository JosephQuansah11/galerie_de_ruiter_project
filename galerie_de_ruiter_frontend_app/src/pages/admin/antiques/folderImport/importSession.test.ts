import { filePath } from "./buildImportGroups";
import { restoreFilePath, storedFile, storedGroup } from "./importSession";
import type { ImportGroupDraft } from "./useFolderImport";

describe("the import session", () => {
  it("keeps a file's folder path beside its bytes", () => {
    const file = new File([new Uint8Array(1)], "front.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "webkitRelativePath", { value: "Root/Mirrors/Carved/front.jpg" });

    const stored = storedFile(file);
    expect(stored.path).toBe("Root/Mirrors/Carved/front.jpg");

    const restored = restoreFilePath(new File([new Uint8Array(1)], "front.jpg", { type: "image/jpeg" }), stored.path);
    expect(filePath(restored)).toBe("Root/Mirrors/Carved/front.jpg");
  });

  it("drops the object URL, which cannot be restored", () => {
    const group = { previewUrl: "blob:http://localhost/1" } as ImportGroupDraft;

    expect(storedGroup(group)).not.toHaveProperty("previewUrl");
  });
});
