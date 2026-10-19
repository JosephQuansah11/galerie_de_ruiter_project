import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import axiosInstance, { setAuthToken } from "./authPromise";
import "./backendClient";
import { readSession } from "@/context/useSupabaseSession";

jest.mock("@/context/useSupabaseSession", () => ({ readSession: jest.fn() }));

const readSessionMock = readSession as jest.Mock;
const originalAdapter = axiosInstance.defaults.adapter;

function session(accessToken: string, expiresAt: number) {
  return { accessToken, refreshToken: "refresh", expiresAt, userId: "u1" };
}

/** Records the Authorization header and refuses any request that carries one. */
function refusingAdapter(): Array<string | undefined> {
  const seen: Array<string | undefined> = [];
  axiosInstance.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const authorization = config.headers?.Authorization as string | undefined;
    seen.push(authorization);
    if (authorization) {
      throw new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, undefined, {
        status: 401, statusText: "Unauthorized", headers: {}, config, data: undefined,
      } as AxiosResponse);
    }
    return { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config } as AxiosResponse;
  };
  return seen;
}

function acceptingAdapter(): Array<string | undefined> {
  const seen: Array<string | undefined> = [];
  axiosInstance.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    seen.push(config.headers?.Authorization as string | undefined);
    return { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config } as AxiosResponse;
  };
  return seen;
}

afterEach(() => {
  axiosInstance.defaults.adapter = originalAdapter;
  setAuthToken(undefined);
  readSessionMock.mockReset();
});

describe("the API client's session token", () => {
  it("does not send an expired stored session", async () => {
    readSessionMock.mockReturnValue(session("expired", Date.now() - 1_000));
    const seen = refusingAdapter();

    const response = await axiosInstance.get("/api/antiques");

    expect(response.data).toEqual({ ok: true });
    expect(seen).toEqual([undefined]);
  });

  it("sends a session that is still valid", async () => {
    readSessionMock.mockReturnValue(session("fresh", Date.now() + 60_000));
    const seen = acceptingAdapter();

    const response = await axiosInstance.get("/api/antiques");

    expect(response.data).toEqual({ ok: true });
    expect(seen).toEqual(["Bearer fresh"]);
  });

  it("does not put a refused token back on the retry", async () => {
    readSessionMock.mockReturnValue(session("refused", Date.now() + 60_000));
    const seen = refusingAdapter();

    const response = await axiosInstance.get("/api/categories");

    expect(response.data).toEqual({ ok: true });
    expect(seen).toEqual(["Bearer refused", undefined]);
    // The stored session is still read for the next request; the auth layer is what clears it.
    expect(readSessionMock).toHaveBeenCalled();
  });
});
