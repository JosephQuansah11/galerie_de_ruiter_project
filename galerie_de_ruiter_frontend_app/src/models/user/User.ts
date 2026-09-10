import { Address, AddressForm } from "./Address";
import { UserProfile } from "./UserProfile";

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
    // Activity tracking fields
    lastActive: Date | null;
    status: 'active' | 'idle' | 'inactive';
    churchId: string | null;
};

export type UserForm = {
    keycloakId: string;
    userName: string;
    email: string;
    telephone: string;
    password: string;
    address: AddressForm;
    profile: UserProfile;
    role: string;
    // Activity tracking fields
    lastActive: Date | null;
    status: 'active' | 'idle' | 'inactive';
    churchId: string | null;
};

export const initialUserForm: UserForm = {
    keycloakId: '',
    userName: '',
    email: '',
    telephone: '',
    password: '',
    address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        countryCode: '',
    },
    profile: {
        firstName: '',
        lastName: '',
        preferences: {
            language: '',
            theme: '',
            notifications: false,
        },
        avatar: '',
    },
    role: '',
    lastActive: null,
    status: 'inactive',
    churchId: null,
};

export default User;