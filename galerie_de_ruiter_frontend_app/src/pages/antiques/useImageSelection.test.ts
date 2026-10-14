import { act, renderHook } from "@testing-library/react";
import { fileListOf, imageFile } from "../../../test/fileList";
import { useImageSelection } from "./useImageSelection";

describe("useImageSelection", () => {
  it("appends each pick and gives every image its own preview url", () => {
    const { result } = renderHook(() => useImageSelection());

    act(() => result.current.add(fileListOf(imageFile("front.jpg"), imageFile("back.jpg"))));
    act(() => result.current.add(fileListOf(imageFile("detail.jpg"))));

    expect(result.current.images.map((image) => image.file.name)).toEqual(["front.jpg", "back.jpg", "detail.jpg"]);
    expect(new Set(result.current.images.map((image) => image.id)).size).toBe(3);
    expect(result.current.images.every((image) => image.url.length > 0)).toBe(true);
  });

  it("reports a non-image and keeps the current selection", () => {
    const onRejectImage = jest.fn();
    const { result } = renderHook(() => useImageSelection(onRejectImage));

    act(() => result.current.add(fileListOf(imageFile("front.jpg"))));
    let accepted = true;
    act(() => { accepted = result.current.add(fileListOf(new File([new Uint8Array(1)], "notes.pdf", { type: "application/pdf" }))); });

    expect(accepted).toBe(false);
    expect(onRejectImage).toHaveBeenCalledTimes(1);
    expect(result.current.images.map((image) => image.file.name)).toEqual(["front.jpg"]);
  });

  it("removes a single image and clears the rest on request", () => {
    const { result } = renderHook(() => useImageSelection());
    act(() => result.current.add(fileListOf(imageFile("front.jpg"), imageFile("back.jpg"))));

    const [first] = result.current.images;
    act(() => result.current.remove(first.id));
    expect(result.current.images.map((image) => image.file.name)).toEqual(["back.jpg"]);

    act(() => result.current.clear());
    expect(result.current.images).toEqual([]);
  });
});
