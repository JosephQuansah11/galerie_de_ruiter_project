import { act, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { addAntique, uploadAntiqueModel } from "@/apis/backend_api";
import type Antique from "@/models/antiques/Antique";
import { useNewAntiqueDraft } from "./useNewAntiqueDraft";
import { MODEL_MAX_SIZE_BYTES } from "./modelUploadLimits";

jest.mock("@/apis/backend_api", () => ({
  addAntique: jest.fn(),
  uploadAntiqueImage: jest.fn(),
  uploadAntiqueModel: jest.fn(),
}));
jest.mock("@/services/contentUpdates", () => ({ publishContentUpdate: jest.fn() }));

const addAntiqueMock = addAntique as jest.MockedFunction<typeof addAntique>;
const uploadModelMock = uploadAntiqueModel as jest.MockedFunction<typeof uploadAntiqueModel>;

const antique = (id: string) => ({ id } as unknown as Antique);

/** A .glb whose reported size is set independently of the buffer, so the size rules can be
 * exercised without allocating a 100 MB file. */
function glbFile(sizeBytes: number, name = "model.glb"): File {
  const file = new File([new Uint8Array(1)], name, { type: "model/gltf-binary" });
  Object.defineProperty(file, "size", { value: sizeBytes });
  return file;
}

const fileList = (file: File) => ({ 0: file, length: 1, item: () => file }) as unknown as FileList;

/** Mirrors an axios HTTP failure so the hook's status handling can be exercised. */
function httpError(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), {
    isAxiosError: true,
    response: { status, data: { detail: "rejected by the server" } },
  });
}

const submitEvent = { preventDefault: jest.fn() } as unknown as FormEvent<HTMLFormElement>;

/** Saves a draft that carries one model file and returns the settled hook state. */
async function submitWithModel(file: File) {
  const openAntique = jest.fn();
  const { result } = renderHook(() => useNewAntiqueDraft(openAntique));
  act(() => result.current.selectModelFile(fileList(file)));
  await act(async () => {
    await result.current.submit(submitEvent);
  });
  return { result, openAntique };
}

let errorSpy: jest.SpyInstance;

beforeEach(() => {
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  addAntiqueMock.mockResolvedValue(antique("antique-1"));
});

describe("useNewAntiqueDraft model upload", () => {
  it("rejects a model above the shared limit before it is saved", () => {
    const { result } = renderHook(() => useNewAntiqueDraft(jest.fn()));
    act(() => result.current.selectModelFile(fileList(glbFile(MODEL_MAX_SIZE_BYTES + 1))));

    expect(result.current.modelFileInvalid).toBe(true);
    expect(result.current.message).toBe("glbUploadInvalid");
    expect(result.current.modelFileName).toBeUndefined();
  });

  it("names a 413 as a model that is too large and logs the real cause", async () => {
    uploadModelMock.mockRejectedValue(httpError(413));

    const { result } = await submitWithModel(glbFile(1024));

    expect(result.current.message).toBe("antiqueModelTooLarge");
    expect(errorSpy.mock.calls.flat().join(" ")).toContain("HTTP 413");
  });

  it("reports a failing server separately from the generic upload error", async () => {
    uploadModelMock.mockRejectedValue(httpError(502));

    const { result } = await submitWithModel(glbFile(1024));

    expect(result.current.message).toBe("antiqueModelServerError");
  });

  it("still opens the saved antique when the model uploads", async () => {
    uploadModelMock.mockResolvedValue(antique("antique-1"));

    const { result, openAntique } = await submitWithModel(glbFile(1024));

    expect(result.current.message).toBeUndefined();
    expect(openAntique).toHaveBeenCalledWith("antique-1");
  });
});
