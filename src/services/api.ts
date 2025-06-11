import axios from 'axios';
import { TodoList, TodoListSummary } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

// Generate or get user ID from localStorage
const getUserId = (): string => {
  let userId = localStorage.getItem('todo-user-id');
  if (!userId || userId === 'undefined' || userId === 'null') {
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('todo-user-id', userId);
  }
  return userId;
};

// Create axios instance with user ID header
const createApiClient = (includeUserId: boolean = true, forceUserId?: string) => {
  const config = {
    baseURL: API_BASE_URL,
    headers: {}
  };
  
  if (includeUserId) {
    const userId = forceUserId || getUserId();
    // Only add the header if we have a valid user ID
    if (userId && userId !== 'undefined' && userId !== 'null') {
      config.headers['x-user-id'] = userId;
    }
  }
  
  return axios.create(config);
};

// Wrapper function to handle API calls with automatic user ID generation
const handleApiCall = async <T>(apiCall: () => Promise<T>, retryWithNewUserId = false): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    // If we get a "User ID required" error, try generating a new user ID
    if (error.response?.status === 400 && 
        error.response?.data?.error === 'User ID required' && 
        retryWithNewUserId) {
      
      // Clear the current user ID and generate a new one
      localStorage.removeItem('todo-user-id');
      const newUserId = getUserId();
      
      // Retry the API call with the new user ID
      return await apiCall();
    }
    throw error;
  }
};

export const api = {
  // Get current user ID
  getCurrentUserId(): string {
    return getUserId();
  },
  
  // Get all todo lists for current user
  async getAllTodoLists(): Promise<TodoListSummary[]> {
    return handleApiCall(async () => {
      const client = createApiClient();
      const response = await client.get('/todos');
      return response.data;
    }, true);
  },
  
  // Create new todo list
  async createTodoList(title: string): Promise<TodoList> {
    return handleApiCall(async () => {
      const client = createApiClient();
      const response = await client.post('/todos', { title });
      return response.data;
    }, true);
  },
  
  // Get specific todo list - FIXED to always try public access first
  async getTodoList(id: string): Promise<TodoList> {
    try {
      // Always try public access first (no user ID header)
      const publicClient = axios.create({
        baseURL: API_BASE_URL,
        headers: {}
      });
      
      const response = await publicClient.get(`/todos/${id}`);
      return response.data;
    } catch (error) {
      // If public access fails with 403, try with user ID
      if (error.response?.status === 403) {
        return handleApiCall(async () => {
          const client = createApiClient(true);
          const response = await client.get(`/todos/${id}`);
          return response.data;
        }, true);
      }
      throw error;
    }
  },
  
  // Update todo list title
  async updateTodoList(id: string, title: string): Promise<TodoList> {
    return handleApiCall(async () => {
      const client = createApiClient();
      const response = await client.put(`/todos/${id}`, { title });
      return response.data;
    }, true);
  },
  
  // Delete entire todo list
  async deleteTodoList(id: string): Promise<void> {
    return handleApiCall(async () => {
      const client = createApiClient();
      await client.delete(`/todos/${id}`);
    }, true);
  },
  
  // Add user to todo list - FIXED to handle no user ID properly
  async addUser(todoId: string, username: string): Promise<TodoList> {
    try {
      // Check if we have a valid stored user ID
      let userId = localStorage.getItem('todo-user-id');
      
      let client;
      if (userId && userId !== 'undefined' && userId !== 'null') {
        // Use existing user ID
        client = createApiClient(true);
      } else {
        // No user ID - create client without user ID header
        client = axios.create({
          baseURL: API_BASE_URL,
          headers: {}
        });
      }
      
      const response = await client.post(`/todos/${todoId}/users`, {
        username
      });
      
      // If server generated a new user ID, store it
      if (response.data.generatedUserId) {
        localStorage.setItem('todo-user-id', response.data.generatedUserId);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Add tasks to todo list
  async addTasks(todoId: string, tasks: string[], username: string): Promise<TodoList> {
    return handleApiCall(async () => {
      const client = createApiClient();
      const response = await client.post(`/todos/${todoId}/tasks`, {
        tasks,
        username
      });
      return response.data;
    }, true);
  },
  
  // Update task status/details
  async updateTask(todoId: string, taskId: string, updates: {
    status?: 'new' | 'open' | 'closed';
    username?: string;
    deadline?: string;
  }): Promise<TodoList> {
    return handleApiCall(async () => {
      const client = createApiClient();
      const response = await client.put(`/todos/${todoId}/tasks/${taskId}`, updates);
      return response.data;
    }, true);
  },
  
  // Delete individual task
  async deleteTask(todoId: string, taskId: string): Promise<TodoList> {
    return handleApiCall(async () => {
      const client = createApiClient();
      const response = await client.delete(`/todos/${todoId}/tasks/${taskId}`);
      return response.data;
    }, true);
  },
  
  // Utility function to reset user ID (useful for debugging)
  resetUserId(): string {
    localStorage.removeItem('todo-user-id');
    return getUserId();
  },
  
  // Check if user has valid stored credentials
  hasValidUserId(): boolean {
    const userId = localStorage.getItem('todo-user-id');
    return !!(userId && userId !== 'undefined' && userId !== 'null');
  }
};