import { User } from "./User";

export interface ResultProps {
  msg: string;
  data: any;
  status: number;
  pageNum?: number;
  totalNum?: number;
  total?: number;
  rooter?: any;
}
export interface Notice {
  _key: string;
  boardInfo: {
    _key: string;
    title: string;
  };
  cardInfo: {
    _key: string;
    title: string;
  } | null;
  fromUserInfo: User;
  hasRead: number;
  log: string;
  time: string;
  type: string;
  status?: number;
  applyKey?: string;
  newRole?: number;
}
