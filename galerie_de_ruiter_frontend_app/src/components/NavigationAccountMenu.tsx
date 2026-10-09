import { useNavigate } from "react-router-dom";
import { Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Avatar } from "./Avatar";

export function NavigationAccountMenu({ onNavigate }: { onNavigate: () => void }) {
  const auth = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const displayName = [auth.profile?.firstName, auth.profile?.lastName].filter(Boolean).join(" ") || auth.profile?.username;
  return <div className="icons-list-user-profile"><Dropdown drop="down">
    <Dropdown.Toggle variant="link" className="text-light p-0 border-0 shadow-none" style={{ background: "none" }}>
      <OverlayTrigger placement="top" overlay={<Tooltip>{t("navProfileMenu")}</Tooltip>}>
        <div className="d-flex flex-row gap-2 align-items-center">
          <Avatar name={auth.profile?.username} firstName={auth.profile?.firstName} lastName={auth.profile?.lastName} imageUrl={auth.avatarUrl} size="small" />
          <small className="text-truncate">{auth.profile?.username}</small>
        </div>
      </OverlayTrigger>
    </Dropdown.Toggle>
    <Dropdown.Menu>
      <Dropdown.Header><strong>{displayName}</strong></Dropdown.Header>
      <Dropdown.Divider />
      <Dropdown.Item onClick={() => { onNavigate(); navigate("/profile"); }}>{t("navProfile")}</Dropdown.Item>
      <Dropdown.Item onClick={() => { onNavigate(); navigate("/preferences"); }}>{t("navSettings")}</Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item className="text-danger" onClick={() => { onNavigate(); auth.logout(); }}>{t("navLogout")}</Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown></div>;
}
