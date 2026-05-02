export type UserRole = "admin" | "client";

export type AppUserProfile = {
  uid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  active: boolean;
};
