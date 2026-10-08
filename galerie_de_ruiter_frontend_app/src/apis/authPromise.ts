import axios from "axios";
import { apiBaseUrl } from "@/apis/apiConfig";

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const setAuthToken = (token: string | undefined) => {
  if (token) {
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common.Authorization;
  }
};

export default axiosInstance;
