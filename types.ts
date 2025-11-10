export enum Sender {
  User = 'USER',
  Drago = 'DRAGO',
  System = 'SYSTEM',
}

export interface SearchSource {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  timestamp: string;
  searchResult?: SearchSource[];
}

export interface Reminder {
  id: string;
  text: string;
  dueTime: number;
  notified: boolean;
}
