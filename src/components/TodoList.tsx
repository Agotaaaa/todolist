import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Divider,
  Button
} from '@mui/material';
import { Share, ArrowBack, Add, Edit, Save, Cancel, Home } from '@mui/icons-material';
import { TodoList as TodoListType, Task, TaskStatus } from '../types';
import { api } from '../services/api';
import { UserModal } from './UserModal';
import { TaskItem } from './TaskItem';

const TaskInput: React.FC<{ onAddTasks: (tasks: string[]) => void; disabled?: boolean; onSubmitStart: () => void; onSubmitEnd: () => void }> = ({ onAddTasks, disabled, onSubmitStart, onSubmitEnd }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    
    const tasks = inputValue
      .split('\n')
      .map(task => task.trim())
      .filter(task => task.length > 0);
    
    if (tasks.length > 0) {
      onSubmitStart(); 
      try {
        await onAddTasks(tasks);
        setInputValue('');
      } finally {
        onSubmitEnd(); 
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); 
      handleSubmit();
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f5f5f5', 
        p: 2,
        zIndex: 1000,
      }}
    >
      <Box maxWidth="md" mx="auto">
        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder="Add new tasks (one per line)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={disabled}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleSubmit}
                  disabled={disabled || !inputValue.trim()}
                  color="primary"
                >
                  <Add />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white', 
              '&:hover': {
                backgroundColor: 'white',
              },
              '&.Mui-focused': {
                backgroundColor: 'white',
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export const TodoList: React.FC = () => {
  const [todoList, setTodoList] = useState<TodoListType | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [hasNavigationHistory, setHasNavigationHistory] = useState(false);
  const [isPublicAccess, setIsPublicAccess] = useState(false);

  useEffect(() => {
    initializeTodoList();
    // Check if user came from within the app or from external link
    setHasNavigationHistory(window.history.length > 1);
  }, []);

 const initializeTodoList = async () => {
  try {
    setLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    const todoId = urlParams.get('id');
    
    if (!todoId) {
      // Redirect to overview if no ID is provided
      window.location.href = '/';
      return;
    }
    
    const savedUser = localStorage.getItem(`todo-user-${todoId}`);
    
    try {
      // Try to load the todo list (API client handles public vs authenticated access)
      const data = await api.getTodoList(todoId);
      setTodoList(data);
      setEditTitle(data.title);
      
      if (savedUser) {
        setCurrentUser(savedUser);
        setIsPublicAccess(false);
        // Silently add user to the list if they're returning
        try {
          await api.addUser(data.id, savedUser);
        } catch (err) {
          // Ignore errors here - user might already be added
        }
      } else {
        setIsPublicAccess(true);
        setShowUserModal(true);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Todo list not found');
      } else if (err.response?.status === 400) {
        setError('Unable to access todo list');
      } else {
        setError('Failed to load todo list');
      }
    }
  } catch (err) {
    setError('Failed to load todo list');
  } finally {
    setLoading(false);
  }
};

  const handleUserSubmit = async (username: string) => {
    try {
      if (!todoList) return;
      
      const updatedList = await api.addUser(todoList.id, username);
      setTodoList(updatedList);
      setCurrentUser(username);
      localStorage.setItem(`todo-user-${todoList.id}`, username);
      setShowUserModal(false);
    } catch (err) {
      setError('Failed to add user');
    }
  };

  const handleAddTasks = async (tasks: string[]) => {
    try {
      if (!todoList || !currentUser) return;
      
      const updatedList = await api.addTasks(todoList.id, tasks, currentUser);
      setTodoList(updatedList);
    } catch (err) {
      setError('Failed to add tasks');
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      if (!todoList || !currentUser) return;
      
      const updatedList = await api.updateTask(todoList.id, taskId, {
        status,
        username: currentUser
      });
      setTodoList(updatedList);
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleDeadlineChange = async (taskId: string, deadline: string) => {
    try {
      if (!todoList || !currentUser) return;
      
      const updatedList = await api.updateTask(todoList.id, taskId, {
        deadline,
        username: currentUser
      });
      setTodoList(updatedList);
    } catch (err) {
      setError('Failed to update deadline');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      if (!todoList) return;
      
      const updatedList = await api.deleteTask(todoList.id, taskId);
      setTodoList(updatedList);
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // Show success message
      setError('');
      // You could add a toast notification here to confirm the copy action
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const handleTitleEdit = async () => {
    if (!todoList || !editTitle.trim()) return;

    try {
      const updatedList = await api.updateTodoList(todoList.id, editTitle.trim());
      setTodoList(updatedList);
      setEditingTitle(false);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Only the list creator can edit the title');
      } else {
        setError('Failed to update title');
      }
    }
  };

  const handleSubmitStart = () => {
    setIsSubmitting(true);
  };

  const handleSubmitEnd = () => {
    setIsSubmitting(false);
  };

  const handleNavigation = () => {
    if (hasNavigationHistory) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  const goToOverview = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{ backgroundColor: '#f5f5f5' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!todoList) {
    return (
      <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Container>
          <Alert severity="error">{error || 'Failed to load todo list'}</Alert>
        </Container>
      </Box>
    );
  }

  const totalTasks = todoList.tasks.length;
  const currentUserId = api.getCurrentUserId();
  const isCreator = todoList.createdBy === currentUserId;

  return (
    <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <AppBar 
        position="static" 
        elevation={1}
        sx={{
         backgroundColor: '#424242',
          filter: isSubmitting ? 'blur(2px)' : 'none',
          transition: 'filter 0.3s ease-in-out',
        }}
      >
        <Toolbar>
          <Tooltip title={hasNavigationHistory ? "Go back" : "Go to overview"}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleNavigation}
              sx={{ mr: 2 }}
            >
              {hasNavigationHistory ? <ArrowBack /> : <Home />}
            </IconButton>
          </Tooltip>
          
          {editingTitle ? (
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ 
                  flexGrow: 1,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'white',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                  }
                }}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTitleEdit();
                  }
                  if (e.key === 'Escape') {
                    setEditingTitle(false);
                    setEditTitle(todoList.title);
                  }
                }}
              />
              <IconButton color="inherit" onClick={handleTitleEdit}>
                <Save />
              </IconButton>
              <IconButton 
                color="inherit" 
                onClick={() => {
                  setEditingTitle(false);
                  setEditTitle(todoList.title);
                }}
              >
                <Cancel />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" component="div">
                {todoList.title}
              </Typography>
              {isCreator && (
                <IconButton
                  color="inherit"
                  size="small"
                  onClick={() => setEditingTitle(true)}
                >
                  <Edit fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}
          
          <Box display="flex" alignItems="center" gap={1}>
            {todoList.users.map(user => (
              <Chip
                key={user.username}
                label={user.username}
                size="small"
                color={user.username === currentUser ? 'secondary' : 'default'}
                variant="outlined"
              />
            ))}
            
            <Tooltip title="Copy shareable link">
              <IconButton color="inherit" onClick={handleShare}>
                <Share />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Container 
        maxWidth="md" 
        sx={{ 
          py: 3, 
          pb: 20,
          filter: isSubmitting ? 'blur(2px)' : 'none',
          transition: 'filter 0.3s ease-in-out',
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}


                 {!currentUser ? (
            <Box textAlign="center" py={6}>
              <Typography variant="h6" color="text.secondary">
                Welcome to {todoList.title}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                Please enter your username to start contributing.
              </Typography>
            </Box>
          ) : (
            <>
              {totalTasks === 0 ? (
                <Typography variant="body1" color="text.secondary" textAlign="center" mt={4}>
                  No tasks yet. Add some tasks below to get started!
                </Typography>
              ) : (
                todoList.tasks.map((task: Task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    currentUser={currentUser}
                    onStatusChange={handleStatusChange}
                    onDeadlineChange={handleDeadlineChange}
                    onDelete={handleDeleteTask}
                    isCreator={isCreator}
                  />
                ))
              )}
            </>
          )}
        </Container>

        {currentUser && (
          <TaskInput
            onAddTasks={handleAddTasks}
            disabled={isSubmitting}
            onSubmitStart={handleSubmitStart}
            onSubmitEnd={handleSubmitEnd}
          />
        )}

        {showUserModal && (
          <UserModal
            open={showUserModal}
            onClose={() => setShowUserModal(false)}
            onSubmit={handleUserSubmit}
          />
        )}
      </Box>
    );
};
