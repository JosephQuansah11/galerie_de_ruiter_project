import { UUID } from "crypto";

export type Address = {
    id: UUID;
    street: string; 
    city: string; 
    state: string; 
    zipCode: string; 
    country: string; 
    countryCode: string;
}

export type AddressForm = {
    street: string; 
    city: string; 
    state: string; 
    zipCode: string; 
    country: string; 
    countryCode: string;
}
