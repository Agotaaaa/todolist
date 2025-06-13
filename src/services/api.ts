import axios from 'axios';
import { TodoList, TodoListSummary } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

// User management
const getUserData = () => {
  const userData = localStorage.getItem('todo-user-data');
  return userData ? JSON.parse(userData) : null;
};

const setUserData = (userData) => {
  localStorage.setItem('todo-user-data', JSON.stringify(userData));
};

const clearUserData = () => {
  localStorage.removeItem('todo-user-data');
};

// Create axios instance with user ID header
const createApiClient = (includeAuth = true) => {
  const config = {
    baseURL: API_BASE_URL,
    headers: {}
  };
  
  if (includeAuth) {
    const userData = getUserData();
    if (userData && userData.id) {
      config.headers['x-user-id'] = userData.id;
    }
  }
  
  return axios.create(config);
};

export const api = {
  // Authentication methods
  async register(username, password) {
    try {
      const client = createApiClient(false);
      const response = await client.post('/auth/register', {
        username,
        password
      });
      
      // Store user data
      setUserData(response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async login(username, password) {
    try {
      const client = createApiClient(false);
      const response = await client.post('/auth/login', {
        username,
        password
      });
      
      // Store user data
      setUserData(response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout() {
    clearUserData();
  },

  getCurrentUser() {
    return getUserData();
  },

  isAuthenticated() {
    const userData = getUserData();
    return !!(userData && userData.id);
  },

  // Todo list methods
  async getAllTodoLists() {
    try {
      const client = createApiClient();
      const response = await client.get('/todos');
      return response.data; // Now returns { created: [...], shared: [...] }
    } catch (error) {
      // If authentication fails, redirect to login
      if (error.response?.status === 401) {
        clearUserData();
        window.location.href = '/login';
      }
      throw error;
    }
  },

  async markTodoAsAccessed(todoId, username = null) {
    try {
      const client = createApiClient();
      const response = await client.post(`/todos/${todoId}/access`, {
        username
      });
      return response.data;
    } catch (error) {
      // For guest users, try without authentication
      if (error.response?.status === 401 && username) {
        try {
          const publicClient = axios.create({
            baseURL: API_BASE_URL,
            headers: {}
          });
          const response = await publicClient.post(`/todos/${todoId}/access`, {
            username
          });
          return response.data;
        } catch (publicError) {
          throw publicError;
        }
      }
      throw error;
    }
  },

  async createTodoList(title) {
    try {
      const client = createApiClient();
      const response = await client.post('/todos', { title });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearUserData();
        window.location.href = '/login';
      }
      throw error;
    }
  },

  async getTodoList(id) {
    try {
      // Try public access first (for sharing)
      const publicClient = axios.create({
        baseURL: API_BASE_URL,
        headers: {}
      });
      
      const response = await publicClient.get(`/todos/${id}`);
      return response.data;
    } catch (error) {
      // If public access fails, try with authentication
      if (error.response?.status === 403) {
        try {
          const client = createApiClient();
          const response = await client.get(`/todos/${id}`);
          return response.data;
        } catch (authError) {
          if (authError.response?.status === 401) {
            clearUserData();
            window.location.href = '/login';
          }
          throw authError;
        }
      }
      throw error;
    }
  },

  async joinTodoList(todoId) {
    try {
      const client = createApiClient();
      const response = await client.post(`/todos/${todoId}/join`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearUserData();
        window.location.href = '/login';
      }
      throw error;
    }
  },

  async updateTodoList(id, title) {
    try {
      const client = createApiClient();
      const response = await client.put(`/todos/${id}`, { title });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearUserData();
        window.location.href = '/login';
      }
      throw error;
    }
  },

  async deleteTodoList(id) {
    try {
      const client = createApiClient();
      await client.delete(`/todos/${id}`);
    } catch (error) {
      if (error.response?.status === 401) {
        clearUserData();
        window.location.href = '/login';
      }
      throw error;
    }
  },

  async addUser(todoId, username) {
    try {
      const client = createApiClient();
      const response = await client.post(`/todos/${todoId}/users`, {
        username
      });
      return response.data;
    } catch (error) {
      // For guest users, try without authentication
      if (error.response?.status === 401) {
        try {
          const publicClient = axios.create({
            baseURL: API_BASE_URL,
            headers: {}
          });
          const response = await publicClient.post(`/todos/${todoId}/users`, {
            username
          });
          return response.data;
        } catch (publicError) {
          throw publicError;
        }
      }
      throw error;
    }
  },

  // FIXED: getTodoListUsers method - now consistent with other methods
  async getTodoListUsers(todoListId) {
    try {
      const client = createApiClient();
      const response = await client.get(`/todos/${todoListId}/users`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearUserData();
        window.location.href = '/login';
      }
      throw error;
    }
  },

  async addTasks(todoId, tasks, username) {
    try {
      const client = createApiClient();
      const response = await client.post(`/todos/${todoId}/tasks`, {
        tasks,
        username
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearUserData();
        window.location.href = '/login';
      }
      throw error;
    }
  },

  async updateTask(todoId, taskId, updates) {
    try {
      const client = createApiClient();
      const response = await client.put(`/todos/${todoId}/tasks/${taskId}`, updates);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearUserData();
        window.location.href = '/login';
      }
      throw error;
    }
  },

  async deleteTask(todoId, taskId) {
    try {
      const client = createApiClient();
      const response = await client.delete(`/todos/${todoId}/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearUserData();
        window.location.href = '/login';
      }
      throw error;
    }
  }
};