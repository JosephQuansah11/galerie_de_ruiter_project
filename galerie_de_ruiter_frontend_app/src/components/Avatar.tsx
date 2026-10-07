import { useTranslation } from "react-i18next";

type AvatarProps = {
  name?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  size?: "small" | "medium" | "large";
};

export function Avatar({
  name,
  firstName,
  lastName,
  imageUrl,
  size = "medium",
}: AvatarProps) {
  const { t } = useTranslation();
  const names = [firstName, lastName].filter((part) => part?.trim());
  const displayName = names.join(" ") || name || t("guest");
  const initials = (names.length ? names : displayName.split(/\s+/))
    .map((part) => part?.trim()[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className={`avatar avatar-${size}`}
      aria-label={t("profileNamed", { name: displayName })}
    >
      {imageUrl ? <img src={imageUrl} alt="" /> : initials}
    </span>
  );
}
