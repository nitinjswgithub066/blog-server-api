export interface AdminProfileResponse {
  id: string;
  name: string;
  username: string | null;
  email: string;
  role: string;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}
