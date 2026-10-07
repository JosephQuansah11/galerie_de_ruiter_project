import axiosInstance from "@/apis/authPromise";
export const backendBaseURL = import.meta.env.VITE_JAVA_BACKEND_URL ?? "http://localhost:8080";
export { axiosInstance };
