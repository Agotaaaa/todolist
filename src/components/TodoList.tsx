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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Stack,
  Snackbar
} from '@mui/material';
import { 
  Share, 
  ArrowBack, 
  Add, 
  Edit, 
  Save, 
  Cancel, 
  Home, 
  BookmarkBorder, 
  Bookmark,
  Login,
  PersonAdd
} from '@mui/icons-material';
import { TodoList as TodoListType, Task, TaskStatus } from '../types';
import { api } from '../services/api';
import { UserModal } from './UserModal';
import { TaskItem } from './TaskItem';
import { useNavigate } from "react-router-dom";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

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
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [hasNavigationHistory, setHasNavigationHistory] = useState(false);
  const [isSharedList, setIsSharedList] = useState(false);
  const [canSaveToMyLists, setCanSaveToMyLists] = useState(false);
  const [savingToMyLists, setSavingToMyLists] = useState(false);
  const [isListSaved, setIsListSaved] = useState(false);
  
  // Authentication dialog state
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authTab, setAuthTab] = useState(0);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '' });
  
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    initializeTodoList();
    setHasNavigationHistory(window.history.length > 1);
  }, []);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const initializeTodoList = async () => {
    try {
      setLoading(true);
      const urlParams = new URLSearchParams(window.location.search);
      const todoId = urlParams.get('id');
      
      if (!todoId) {
        window.location.href = '/';
        return;
      }
      
      const user = api.getCurrentUser();
      setAuthenticatedUser(user);
      
      const savedUser = localStorage.getItem(`todo-user-${todoId}`);
      
      try {
        const data = await api.getTodoList(todoId);
        setTodoList(data);
        setEditTitle(data.title);
        
        let currentUserName = '';
        let isShared = false;
        
        if (user) {
          currentUserName = user.username;
          isShared = data.createdBy !== user.id;
          
          if (!data.users?.some(u => u.userId === user.id)) {
            try {
              const updatedList = await api.addUser(data.id, user.username);
              setTodoList(updatedList);
              setCurrentUser(currentUserName);
            } catch (err) {
              console.warn('Failed to auto-join list:', err);
              setCurrentUser(currentUserName);
            }
          } else {
            setCurrentUser(currentUserName);
          }
          
          setShowUserModal(false);
          
        } else if (savedUser) {
          currentUserName = savedUser;
          isShared = data.createdBy !== savedUser;
          setCurrentUser(currentUserName);
          
          try {
            await api.addUser(data.id, savedUser);
          } catch (err) {
            // Ignore errors - user might already be added
          }
        } else {
          // Show authentication dialog instead of user modal
          setAuthDialogOpen(true);
        }
        
        setIsSharedList(isShared);
        
        if (user && isShared) {
          const isAlreadyMember = data.users?.some((u: any) => u.userId === user.id);
          setCanSaveToMyLists(!isAlreadyMember);
          setIsListSaved(isAlreadyMember);
        }
        
      } catch (err: any) {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.username || !loginForm.password) {
      showSnackbar('Please fill in all fields', 'error');
      return;
    }

    setAuthLoading(true);
    try {
      const user = await api.login(loginForm.username, loginForm.password);
      setAuthenticatedUser(user);
      setCurrentUser(user.username);
      setAuthDialogOpen(false);
      setLoginForm({ username: '', password: '' });
      showSnackbar(`Welcome back, ${user.username}!`, 'success');
      
      // Re-initialize the todo list with the authenticated user
      await initializeTodoList();
    } catch (error: any) {
      if (error.response?.status === 401) {
        showSnackbar('Invalid username or password', 'error');
      } else if (error.response?.data?.error) {
        showSnackbar(error.response.data.error, 'error');
      } else {
        showSnackbar('Login failed. Please try again.', 'error');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerForm.username || !registerForm.password || !registerForm.confirmPassword) {
      showSnackbar('Please fill in all fields', 'error');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      showSnackbar('Passwords do not match', 'error');
      return;
    }

    if (registerForm.username.length < 3) {
      showSnackbar('Username must be at least 3 characters long', 'error');
      return;
    }

    if (registerForm.password.length < 6) {
      showSnackbar('Password must be at least 6 characters long', 'error');
      return;
    }

    setAuthLoading(true);
    try {
      const user = await api.register(registerForm.username, registerForm.password);
      setAuthenticatedUser(user);
      setCurrentUser(user.username);
      setAuthDialogOpen(false);
      setRegisterForm({ username: '', password: '', confirmPassword: '' });
      showSnackbar(`Welcome, ${user.username}!`, 'success');
      
      // Re-initialize the todo list with the authenticated user
      await initializeTodoList();
    } catch (error: any) {
      if (error.response?.status === 409) {
        showSnackbar('Username already exists', 'error');
      } else if (error.response?.data?.error) {
        showSnackbar(error.response.data.error, 'error');
      } else {
        showSnackbar('Registration failed. Please try again.', 'error');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setAuthTab(newValue);
  };

  // Add a function to handle guest access
  const handleGuestAccess = () => {
    setAuthDialogOpen(false);
    setShowUserModal(true);
  };

  const handleSaveToMyLists = async () => {
    if (!todoList) return;
    
    setSavingToMyLists(true);
    try {
      if (authenticatedUser) {
        const API_BASE_URL = 'http://localhost:3001';
        const response = await fetch(`${API_BASE_URL}/api/todos/${todoList.id}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': authenticatedUser.id,
          },
          body: JSON.stringify({
            username: authenticatedUser.username
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save todo list');
        }
      } else {
        const savedListsKey = `my-saved-lists-${currentUser}`;
        const existingSavedLists = JSON.parse(localStorage.getItem(savedListsKey) || '[]');
                
        if (!existingSavedLists.some(list => list.id === todoList.id)) {
          existingSavedLists.push({
            id: todoList.id,
            title: todoList.title,
            createdBy: todoList.createdBy,
            savedAt: new Date().toISOString()
          });
          localStorage.setItem(savedListsKey, JSON.stringify(existingSavedLists));
        }
      }
      
      setCanSaveToMyLists(false);
      setIsListSaved(true);
      setError('Todo list saved to your lists!');
      
      setTimeout(() => {
        setError('');
      }, 2000);
      
      await initializeTodoList();
    } catch (error: any) {
      console.error('Error saving todo list:', error);
      setError(error.message || 'Failed to save todo list');
    } finally {
      setSavingToMyLists(false);
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
      
      const isShared = updatedList.createdBy !== username;
      setIsSharedList(isShared);
      if (isShared && !authenticatedUser) {
        setCanSaveToMyLists(true);
      }
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

  const handleTaskEdit = async (taskId: string, newText: string) => {
    try {
      if (!todoList || !currentUser) return;
      
      const updatedList = await api.updateTask(todoList.id, taskId, {
        text: newText,
        username: currentUser
      });
      setTodoList(updatedList);
    } catch (err) {
      setError('Failed to update task');
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
      setError('');
      
      const originalError = error;
      setError('Link copied to clipboard! Share it with others to collaborate.');
      setTimeout(() => {
        setError(originalError);
      }, 3000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setError('Link copied to clipboard! Share it with others to collaborate.');
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const handleTitleEdit = async () => {
    if (!todoList || !editTitle.trim()) return;

    try {
      const updatedList = await api.updateTodoList(todoList.id, editTitle.trim());
      setTodoList(updatedList);
      setEditingTitle(false);
    } catch (err: any) {
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
    navigate("/");
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
  const isCreator = authenticatedUser ? 
    todoList.createdBy === authenticatedUser.id : 
    todoList.createdBy === currentUser;

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
              {!isCreator && (
                <Chip
                  label="Shared"
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          )}
          
          <Box display="flex" alignItems="center" gap={1}>
            {canSaveToMyLists && currentUser && (
              <Button
                onClick={handleSaveToMyLists}
                disabled={savingToMyLists}
                startIcon={savingToMyLists ? <CircularProgress size={16} /> : <BookmarkBorder />}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  mr: 1
                }}
                size="small"
              >
                {savingToMyLists ? 'Saving...' : 'Save to My Lists'}
              </Button>
            )}
            
            {isListSaved && isSharedList && (
              <Chip
                icon={<Bookmark />}
                label="Saved"
                size="small"
                color="success"
                variant="outlined"
                sx={{ mr: 1 }}
              />
            )}
            
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
          <Alert 
            severity={error.includes('copied') || error.includes('saved') ? 'success' : 'error'} 
            sx={{ mb: 3 }} 
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {!currentUser ? (
          <Box textAlign="center" py={6}>
            <Typography variant="h6" color="text.secondary">
              Welcome to {todoList.title}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              Please log in or create an account to start contributing to this todo list.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              You can also continue as a guest user if you prefer.
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
                  onTaskEdit={handleTaskEdit}
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

      {/* Authentication Dialog */}
      <Dialog
        open={authDialogOpen}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 0 }}>
          <Typography variant="h5" component="div" textAlign="center">
            Join Todo List: {todoList?.title}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={authTab} onChange={handleAuthTabChange} centered>
              <Tab label="Login" icon={<Login />} />
              <Tab label="Register" icon={<PersonAdd />} />
            </Tabs>
          </Box>

          <TabPanel value={authTab} index={0}>
            <form onSubmit={handleLogin}>
              <Stack spacing={3}>
                <TextField
                  label="Username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  fullWidth
                  autoFocus
                  disabled={authLoading}
                />
                <TextField
                  label="Password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  fullWidth
                  disabled={authLoading}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={authLoading}
                  startIcon={authLoading ? <CircularProgress size={20} /> : <Login />}
                  sx={{ mt: 2 }}
                >
                  {authLoading ? 'Logging in...' : 'Login'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleGuestAccess}
                  disabled={authLoading}
                  sx={{ mt: 1 }}
                >
                  Continue as Guest
                </Button>
              </Stack>
            </form>
          </TabPanel>

          <TabPanel value={authTab} index={1}>
            <form onSubmit={handleRegister}>
              <Stack spacing={3}>
                <TextField
                  label="Username"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                  fullWidth
                  autoFocus
                  disabled={authLoading}
                  helperText="At least 3 characters"
                />
                <TextField
                  label="Password"
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                  fullWidth
                  disabled={authLoading}
                  helperText="At least 6 characters"
                />
                <TextField
                  label="Confirm Password"
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  fullWidth
                  disabled={authLoading}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={authLoading}
                  startIcon={authLoading ? <CircularProgress size={20} /> : <PersonAdd />}
                  sx={{ mt: 2 }}
                >
                  {authLoading ? 'Creating Account...' : 'Register'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleGuestAccess}
                  disabled={authLoading}
                  sx={{ mt: 1 }}
                >
                  Continue as Guest
                </Button>
              </Stack>
            </form>
          </TabPanel>
        </DialogContent>
      </Dialog>

      {/* User Modal for Guest Access */}
      {showUserModal && !authenticatedUser && (
        <UserModal
          open={showUserModal}
          onClose={() => setShowUserModal(false)}
          onSubmit={handleUserSubmit}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleSnackbarClose}severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};