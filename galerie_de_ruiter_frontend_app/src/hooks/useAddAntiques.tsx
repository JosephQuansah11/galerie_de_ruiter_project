import Antique, { AntiqueForm } from "../models/antiques/Antique";
import { useEffect, useState, useMemo } from "react";
import { getAllAntiques, addAntique } from "../apis/backend_api";
import {
    publishContentUpdate,
    subscribeToContentUpdates,
} from "../services/contentUpdates";

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
        let active = true;
        const fetchAntiques = async () => {
            try {
                const response = await getAllAntiques();
                if (!active) return;
                setAntiques(response);
                setError(null);
                setLoading(false);
            } catch (error) {
                if (!active) return;
                setError(error as string);
                setLoading(false);
            }
        };
        void fetchAntiques();
        const unsubscribe = subscribeToContentUpdates("antiques", fetchAntiques);
        return () => {
            active = false;
            unsubscribe();
        };
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
    await addAntique(antique);
    publishContentUpdate("antiques");
}
