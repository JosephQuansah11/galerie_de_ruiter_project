import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { DynamicForm } from "../../components/UI";
import { useAuth } from "../../context/AuthContext";
import type { FormField, UserProfile } from "../../types/types";

type Registration = UserProfile & { password: string };
const fields: FormField<Registration>[] = [
  { name: "username", label: "Username", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "firstName", label: "First name", required: true },
  { name: "lastName", label: "Last name", required: true },
  {
    name: "password",
    label: "Password",
    type: "password",
    required: true,
    placeholder: "At least 8 characters",
  },
];

export function AuthPage() {
  const auth = useAuth();
  const [error, setError] = useState("");
  const submit = async (registration: Registration) => {
    try {
      await auth.register(registration);
    } catch {
      setError(
        "Registration could not be completed. Check the Java API and Keycloak configuration.",
      );
    }
  };
  return (
    <div className="page auth-page">
      <div className="auth-panel">
        <div className="eyebrow">JAVA + KEYCLOAK ACCOUNT</div>
        <h1>Create your Fable account</h1>
        <p>
          The Java backend creates the Keycloak identity and synchronizes the
          application profile.
        </p>
        {error && <div className="notice">{error}</div>}
        <DynamicForm
          fields={fields}
          initialValue={{
            username: "",
            email: "",
            firstName: "",
            lastName: "",
            password: "",
          }}
          submitLabel="Create account"
          onSubmit={submit}
        />
        <button className="quiet-button auth-login" onClick={auth.login}>
          <LogIn size={16} />
          Already have an account? Sign in
        </button>
      </div>
      <div className="auth-aside">
        <UserPlus size={28} />
        <strong>One identity, shared everywhere.</strong>
        <span>
          Your roles and profile come from the Java-backed Keycloak realm.
        </span>
      </div>
    </div>
  );
}
