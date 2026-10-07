import type { Address, AddressForm } from "./Address";
import type { UserProfile } from "./UserProfile";

type User = {
    id: number;
    keycloakId: string;
    userName: string;
    email: string;
    telephone: string;
    password: string;
    address: Address;
    profile: UserProfile;
    role: string;
    lastActive: Date | null;
    status: 'active' | 'idle' | 'inactive';
    churchId: string | null;
};

export type UserForm = Omit<User, "id" | "address"> & { address: AddressForm };

export default User;