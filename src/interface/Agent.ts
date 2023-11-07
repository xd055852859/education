import { Person, User } from "./User";

export interface Agent {
  creatorInfo?: Person;
  memberCount?: number;
  contact: string;
  status: number;
  name: string;
  email?: string;
  role: number;
  icon?: string;
  _key: string;
}
export interface AgentInfo {
  role: number;
  name: string;
  icon: string;
  contact: string;
  email: string;
}

export interface AgentMember {
  mobile: string;
  role: number;
  userAvatar: null | string;
  userKey: string;
  userName: null | string;
}
