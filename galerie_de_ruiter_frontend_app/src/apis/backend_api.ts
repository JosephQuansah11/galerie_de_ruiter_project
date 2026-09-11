
import axiosInstance from '@/apis/authPromise';
import Antique , {AntiqueForm} from '@/models/antiques/Antique';

const backendBaseURL = import.meta.env.VITE_JAVA_BACKEND_URL ?? "http://localhost:8080";


export const getAllAntiques = (): Promise<Antique[]> => {
   return axiosInstance.get(`${backendBaseURL}/api/antiques`)
}

export const addAntique = (antique: Antique): Promise<AntiqueForm> => {
    return axiosInstance.post(`${backendBaseURL}/api/antiques`, antique);
}