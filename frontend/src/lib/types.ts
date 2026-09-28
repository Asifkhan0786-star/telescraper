export interface TelegramGroup {
  id: string;
  title: string;
  type: 'group' | 'channel' | 'supergroup' | string;
  username?: string;
  participants_count?: number;
}

export interface GroupMember {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  phone?: string;
  is_bot: boolean;
}

export interface MemberListResponse {
  group_id: string;
  group_title: string;
  total_count: number;
  members: GroupMember[];
  has_more: boolean;
}

export interface AuthStatus {
  is_authenticated: boolean;
  user_id?: number;
  username?: string;
  telegram_id?: string;
  phone_number?: string;
}

export interface StartAuthResponse {
  phone_number: string;
  phone_code_hash: string;
  message: string;
}

export interface VerifyAuthResponse {
  requires_2fa?: boolean;
  access_token?: string;
  token_type?: string;
  user_id?: number;
  username?: string;
  telegram_id?: string;
  message?: string;
}
