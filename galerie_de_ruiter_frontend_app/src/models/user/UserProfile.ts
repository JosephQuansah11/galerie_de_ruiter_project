import { UserPreferences } from "./UserPreferences";

export type UserProfile = {
    firstName: string;
    lastName: string;
    preferences: UserPreferences;
    avatar: string;

}
