import axiosInstance from "@/apis/authPromise";
import { csrfHeaders } from "@/apis/client";
import Antique, {
  AntiqueForm,
  Category,
  Designer,
} from "@/models/antiques/Antique";

export type StoreLocation = {
  id: string;
  address: string;
  openingHours: string;
  latitude: number;
  longitude: number;
};

export type AboutContent = { content: string };

const backendBaseURL =
  import.meta.env.VITE_JAVA_BACKEND_URL ?? "http://localhost:8080";

export const getAboutContent = async (): Promise<AboutContent> => {
  const response = await axiosInstance.get<AboutContent>(
    `${backendBaseURL}/api/about`,
  );
  return response.data;
};

export const updateAboutContent = async (
  content: string,
): Promise<AboutContent> => {
  const response = await axiosInstance.put<AboutContent>(
    `${backendBaseURL}/api/about`,
    { content },
    { headers: await csrfHeaders() },
  );
  return response.data;
};

export const getAllAntiques = async (): Promise<Antique[]> => {
  const response = await axiosInstance.get<
    Antique[] | { content?: Antique[]; antiques?: Antique[]; data?: Antique[] }
  >(`${backendBaseURL}/api/antiques`);
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  return payload.content ?? payload.antiques ?? payload.data ?? [];
};

export const addAntique = async (antique: AntiqueForm): Promise<Antique> => {
  const response = await axiosInstance.post<Antique>(
    `${backendBaseURL}/api/antiques`,
    antique,
  );
  return response.data;
};

export const uploadAntiqueImage = async (
  id: string,
  image: File,
): Promise<void> => {
  const body = new FormData();
  body.append("image", image);
  // Clear the instance's default JSON header so axios sets the multipart boundary itself.
  await axiosInstance.put(`${backendBaseURL}/api/antiques/${id}/image`, body, {
    headers: { "Content-Type": undefined },
  });
};

const fileToBase64 = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Could not convert image to base64"));
        return;
      }

      // Remove "data:image/jpeg;base64," etc.
      const base64 = result.split(",")[1];

      if (!base64) {
        reject(new Error("Invalid base64 image data"));
        return;
      }

      resolve(base64);
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read image"));
    };

    reader.readAsDataURL(file);
  });

// export const saveAntiqueReconstruction = async (
//     id: string,
//     views: { position: string; image: File; contentType: string }[],
//     modelUrl?: string | null,
// ): Promise<Antique> => {
//       const body = new FormData();
//     body.append("image", views[0].image);
//     const response = await axiosInstance.put<Antique>(`${backendBaseURL}/api/antiques/${id}/reconstruction`, { views, modelUrl });
//     return response.data;
// };

export const saveAntiqueReconstruction = async (
  id: string,
  views: {
    position: string;
    image_data: File;
  }[],
  modelUrl?: string | null,
): Promise<Antique> => {
  const reconstructionViews = await Promise.all(
    views.map(async (view) => {
      const imageData = await fileToBase64(view.image_data);
      return {
        position: view.position,
        imageData,
        contentType: view.image_data.type // Assuming JPEG; adjust as needed
      };
    }),
  );

  const response = await axiosInstance.put<Antique>(
    `${backendBaseURL}/api/antiques/${id}/reconstruction`,
    {
      views: reconstructionViews,
      modelUrl: modelUrl ?? null,
    },
  );

  return response.data;
};


export const getAntiqueReconstructionImages = async (
  id: string,
): Promise<{ position: string; imageData: string; contentType: string }[]> => {
  const response = await axiosInstance.get<{ position: string; imageData: string; contentType: string }[]>(
    `${backendBaseURL}/api/antiques/${id}/reconstruction`,
  );
  return response.data;
}


export const getVisibleCategories = async (): Promise<Category[]> => {
  const response = await axiosInstance.get<Category[]>(
    `${backendBaseURL}/api/categories`,
  );
  return response.data;
};

export const getAllCategories = async (): Promise<Category[]> => {
  const response = await axiosInstance.get<Category[]>(
    `${backendBaseURL}/api/categories/admin`,
  );
  return response.data;
};

export const getAllDesigners = async (): Promise<Designer[]> => {
  const response = await axiosInstance.get<Designer[]>(
    `${backendBaseURL}/api/designers`,
  );
  return response.data;
};

export const searchDesigners = async (query: string): Promise<Designer[]> => {
  const response = await axiosInstance.get<Designer[]>(
    `${backendBaseURL}/api/designers/search`,
    { params: { query } },
  );
  return response.data;
};

export const createDesigner = async (
  designer: Omit<Designer, "id">,
): Promise<Designer> => {
  const response = await axiosInstance.post<Designer>(
    `${backendBaseURL}/api/designers/add/designer`,
    designer,
  );
  return response.data;
};

export const updateCategory = async (category: Category): Promise<Category> => {
  const response = await axiosInstance.put<Category>(
    `${backendBaseURL}/api/categories/${category.id}`,
    {
      name: category.name,
      parentId: category.parentId ?? null,
      visible: category.visible,
    },
  );
  return response.data;
};

export const createCategory = async (
  name: string,
  parentId?: string,
): Promise<Category> => {
  const response = await axiosInstance.post<Category>(
    `${backendBaseURL}/api/categories`,
    { name, parentId: parentId || null, visible: true },
  );
  return response.data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${backendBaseURL}/api/categories/${id}`);
};

export const getStoreLocation = async (): Promise<StoreLocation> => {
  const response = await axiosInstance.get<StoreLocation>(
    `${backendBaseURL}/api/location`,
  );
  return response.data;
};

export const updateStoreLocation = async (
  location: Omit<StoreLocation, "id">,
): Promise<StoreLocation> => {
  const response = await axiosInstance.put<StoreLocation>(
    `${backendBaseURL}/api/location`,
    location,
  );
  return response.data;
};
