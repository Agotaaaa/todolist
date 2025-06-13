import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, LogIn, User, Lock, AlertCircle, Loader, Plus, List, Trash2, Users, Calendar } from 'lucide-react';

// Simple in-memory storage for demo
let currentUser = null;
let todoLists = [];

// Mock API functions
const mockApi = {
  login: async (username, password) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (username === 'demo' && password === 'password') {
      const userData = {
        id: '123',
        username: 'demo'
      };
      currentUser = userData;
      return userData;
    } else {
      throw new Error('Invalid username or password');
    }
  },

  getCurrentUser: () => currentUser,

  getAllTodoLists: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Return mock data for demo
    return [
      {
        id: '1',
        title: 'Work Tasks',
        taskCount: 5,
        userCount: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.id
      },
      {
        id: '2',
        title: 'Personal Projects',
        taskCount: 3,
        userCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.id
      },
      {
        id: '3',
        title: 'Shopping List',
        taskCount: 8,
        userCount: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.id
      }
    ];
  },

  createTodoList: async (title) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newList = {
      id: Date.now().toString(),
      title,
      taskCount: 0,
      userCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser.id
    };
    
    todoLists.push(newList);
    return newList;
  },

  deleteTodoList: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    todoLists = todoLists.filter(list => list.id !== id);
  }
};

// Login Component
const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (!formData.password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userData = await mockApi.login(formData.username, formData.password);
      onLoginSuccess(userData);
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
              <LogIn className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Todo App</h2>
            <p className="text-gray-600">Sign in to manage your tasks</p>
          </div>

          {/* Demo credentials info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Demo credentials:</strong><br />
              Username: <code className="bg-white px-2 py-1 rounded text-blue-600">demo</code><br />
              Password: <code className="bg-white px-2 py-1 rounded text-blue-600">password</code>
            </p>
          </div>

          <div className="space-y-6">
            {/* Username field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={loading}
                  autoComplete="username"
                  autoFocus
                  className="appearance-none relative block w-full pl-12 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  autoComplete="current-password"
                  className="appearance-none relative block w-full pl-12 pr-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Todo Overview Component
const TodoOverview = ({ user, onLogout }) => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTodoLists();
  }, []);

  const loadTodoLists = async () => {
    try {
      setLoading(true);
      const todoLists = await mockApi.getAllTodoLists();
      setLists(todoLists);
    } catch (error) {
      setError('Failed to load todo lists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewList = async () => {
    try {
      setCreating(true);
      const newList = await mockApi.createTodoList('New Todo List');
      setLists(prev => [newList, ...prev]);
    } catch (error) {
      setError('Failed to create new list');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteList = async (id) => {
    try {
      await mockApi.deleteTodoList(id);
      setLists(prev => prev.filter(list => list.id !== id));
    } catch (error) {
      setError('Failed to delete list');
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-gray-600">Loading your todo lists...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <List className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">My Todo Lists</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user.username}</span>
              </div>
              <button
                onClick={onLogout}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Create new list button */}
        <div className="mb-6">
          <button
            onClick={handleCreateNewList}
            disabled={creating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create New List
              </>
            )}
          </button>
        </div>

        {/* Todo lists */}
        {lists.length === 0 ? (
          <div className="text-center py-12">
            <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No todo lists yet</h3>
            <p className="text-gray-600">Create your first todo list to get started organizing your tasks.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <div
                key={list.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{list.title}</h3>
                    <button
                      onClick={() => setDeleteId(list.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{list.taskCount} tasks</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{list.userCount} users</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Created: {formatDate(list.createdAt)}
                    </div>
                    
                    <div className="pt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Created by you
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Todo List</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this todo list? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteList(deleteId)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const user = mockApi.getCurrentUser();
    setCurrentUser(user);
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    currentUser = null;
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      {currentUser ? (
        <TodoOverview user={currentUser} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default App;