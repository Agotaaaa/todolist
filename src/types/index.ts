export type TaskStatus = 'new' | 'open' | 'closed';

export interface Task {
  id: string;
  text: string;
  status: TaskStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastUpdatedBy?: string;
  deadline?: string;
}
export interface UserAccess {
  isCreator: boolean;
  isMember: boolean;
  canEdit: boolean;
}
export interface User {
  username: string;
  joinedAt: string;
}

export interface TodoList {
  id: string;
  title: string;
  tasks: Task[];
  users: User[];
  createdAt: string;
  updatedAt: string;
}

export interface TodoListSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  userCount: number;
}