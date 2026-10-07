import type { UserForm } from "./User";

export const initialUserForm: UserForm = {
  keycloakId: "",
  userName: "",
  email: "",
  telephone: "",
  password: "",
  address: { street: "", city: "", state: "", zipCode: "", country: "", countryCode: "" },
  profile: {
    firstName: "",
    lastName: "",
    preferences: { language: "", theme: "", notifications: false },
    avatar: "",
    role: "",
  },
  role: "",
  lastActive: null,
  status: "inactive",
  churchId: null,
};
