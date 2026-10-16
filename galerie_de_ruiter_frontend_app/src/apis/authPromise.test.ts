import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import axiosInstance, { setAuthToken, setUnauthorizedHandler } from "./authPromise";

/**
 * The API refuses a token it cannot decode, and it refuses it on the public endpoints too: the
 * resource server fails the request before authorization is consulted, so `GET /api/antiques`
 * answers 401 to a visitor carrying a stale token. The app sends its token with every request, so
 * that used to empty the whole gallery - no collection, no piece pages - for someone who is signed
 * in. These tests pin the recovery: the token is dropped and the one request is retried without it.
 */
const originalAdapter = axiosInstance.defaults.adapter;

/** Answers 401 to any request carrying a token, and to every request when `always` is set. */
function adapterRefusingTokens(always = false): Array<string | undefined> {
  const seen: Array<string | undefined> = [];
  axiosInstance.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const authorization = config.headers?.Authorization as string | undefined;
    seen.push(authorization);
    if (authorization || always) {
      throw new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, undefined, {
        status: 401, statusText: "Unauthorized", headers: {}, config, data: undefined,
      } as AxiosResponse);
    }
    return { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config } as AxiosResponse;
  };
  return seen;
}

afterEach(() => {
  axiosInstance.defaults.adapter = originalAdapter;
  setAuthToken(undefined);
  setUnauthorizedHandler(undefined);
});

describe("a token the API refuses", () => {
  it("is dropped, and the request is retried without it so the public data still arrives", async () => {
    const seen = adapterRefusingTokens();
    const forgetToken = jest.fn();
    setUnauthorizedHandler(forgetToken);
    setAuthToken("stale-token");

    const response = await axiosInstance.get("/api/antiques");

    expect(response.data).toEqual({ ok: true });
    expect(seen).toEqual(["Bearer stale-token", undefined]);
    expect(forgetToken).toHaveBeenCalledTimes(1);
  });

  it("is reported as it is when the request carried no token at all", async () => {
    const seen = adapterRefusingTokens(true);
    const forgetToken = jest.fn();
    setUnauthorizedHandler(forgetToken);

    await expect(axiosInstance.get("/api/me")).rejects.toMatchObject({ response: { status: 401 } });

    // One attempt, no retry and no session to forget: the endpoint really does need an account.
    expect(seen).toEqual([undefined]);
    expect(forgetToken).not.toHaveBeenCalled();
  });
});
