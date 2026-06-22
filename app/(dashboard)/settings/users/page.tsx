import { ComingSoon } from "@/components/coming-soon";

export default function UsersPage() {
  return (
    <ComingSoon
      title="Users"
      description="Manage who can access the system and their roles."
      note="Credential auth (Auth.js) and ADMIN/STAFF/VIEWER roles are part of milestone M0/M1 hardening in the spec."
    />
  );
}
