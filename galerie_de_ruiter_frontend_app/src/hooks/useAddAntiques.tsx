import Antique, { AntiqueForm } from "../models/antiques/Antique";
import { useEffect, useState, useMemo } from "react";
import { getAllAntiques, addAntique } from "../apis/backend_api";

export function useAntiqueContent() {
    const [antiques, setAntiques] = useState<Antique[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Memoize configuration arrays to prevent unnecessary re-renders
    // const displayKeys = useMemo(() => ['name', 'email', 'telephone', 'address'], []);
    // const searchableKeys = useMemo(() => [
    //     'name', 'email', 'telephone', 'address.street', 'address.city', 'address.state', 'address.country'
    // ], []);
    // const innerObjectKeys = useMemo(() => ['street', 'city'], []);
    
    useEffect(() => {
        const fetchAntiques = async () => {
            try {
                const response = await getAllAntiques();
                setAntiques(response);
                setLoading(false);
            } catch (error) {
                setError(error as string);
                setLoading(false);
            }
        };
        fetchAntiques();
    }, []);

//     useEffect(() => {
//         const fetchTotalMembers = async () => {
//             try {
//                 const response = await getTotalMembers();
//                 setTotalMembers(response);
//             } catch (error) {
//                 setError(error as string);
//             }
//         };
//         fetchTotalMembers();
//     }, []);


//     // Memoize the return object to prevent unnecessary re-renders
    return useMemo(() => ({
        antiques,
        loading,
        error
    }), [antiques, loading, error]);
}


export async function AddAntiqueItem(antique: AntiqueForm): Promise<void> {
    try {
        await addAntique(antique as any);
        // Trigger a refresh by updating the component state
        window.location.reload(); // Simple refresh for now
    } catch (error) {
        console.error('Failed to add user:', error);
        throw error;
    }
}

// export async function DeleteUserContent(userId: string): Promise<void> {
//     try {
//         await deleteUser(userId);
//         // Trigger a refresh by updating the component state
//         window.location.reload(); // Simple refresh for now
//     } catch (error) {
//         console.error('Failed to delete user:', error);
//         throw error;
//     }
// }

// export async function EditUserContent(userId: string, user: User): Promise<void> {
//     try {
//          // console.log('final edit: ', userId);
//         await editUserById(userId, user);
//         // Trigger a refresh by updating the component state
//         window.location.reload(); // Simple refresh for now
//     } catch (error) {
//         console.error('Failed to edit user:', error);
//         throw error;
//     }
// }