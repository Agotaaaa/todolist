import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TodoListSummary } from '../types';
import {
  Container,
  List,
  ListItem,
  ListItemText,
  Button,
  Typography,
  Box,
  Paper,
  Stack,
  ListItemAvatar,
  Avatar,
  AppBar,
  Toolbar,
  Chip,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  TextField,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ShareIcon from '@mui/icons-material/Share';
import { Add, Delete, Person, Login, PersonAdd } from '@mui/icons-material';

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

export const TodoOverview: React.FC = () => {
  const [createdLists, setCreatedLists] = useState<TodoListSummary[]>([]);
  const [sharedLists, setSharedLists] = useState<TodoListSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedList, setSelectedList] = useState<TodoListSummary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // User management state
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [selectedListUsers, setSelectedListUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedListForUsers, setSelectedListForUsers] = useState<TodoListSummary | null>(null);
  
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

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    const user = api.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      loadTodoLists();
    } else {
      setAuthDialogOpen(true);
    }
  };

  const loadTodoLists = async () => {
    setLoading(true);
    try {
      const response = await api.getAllTodoLists();
      if (Array.isArray(response)) {
        setCreatedLists(response);
        setSharedLists([]);
      } else {
        setCreatedLists(response.created || []);
        setSharedLists(response.shared || []);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setCurrentUser(null);
        setAuthDialogOpen(true);
        showSnackbar('Please log in to continue', 'error');
      } else {
        showSnackbar('Failed to load todo lists', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewUsers = async (event: React.MouseEvent<HTMLElement>, list: TodoListSummary) => {
    event.stopPropagation();
    setSelectedListForUsers(list);
    setUsersDialogOpen(true);
    setLoadingUsers(true);
    
    try {
      const usersData = await api.getTodoListUsers(list.id);
      
      if (Array.isArray(usersData)) {
        setSelectedListUsers(usersData);
      } else if (usersData.users) {
        setSelectedListUsers(usersData.users);
      } else {
        setSelectedListUsers([]);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        showSnackbar('Todo list not found', 'error');
      } else if (error.response?.status === 403) {
        showSnackbar('Access denied - you do not have permission to view users in this list', 'error');
      } else if (error.response?.status === 401) {
        setCurrentUser(null);
        setAuthDialogOpen(true);
        showSnackbar('Please log in to continue', 'error');
      } else {
        showSnackbar('Failed to load users', 'error');
      }
      
      setSelectedListUsers([]);
    } finally {
      setLoadingUsers(false);
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
      setCurrentUser(user);
      setAuthDialogOpen(false);
      setLoginForm({ username: '', password: '' });
      showSnackbar(`Welcome back, ${user.username}!`, 'success');
      loadTodoLists();
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
      setCurrentUser(user);
      setAuthDialogOpen(false);
      setRegisterForm({ username: '', password: '', confirmPassword: '' });
      showSnackbar(`Welcome, ${user.username}!`, 'success');
      loadTodoLists();
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

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setCreatedLists([]);
    setSharedLists([]);
    setAuthDialogOpen(true);
    showSnackbar('Logged out successfully', 'success');
  };

  const goToTodo = (id: string) => {
    window.location.href = `/todo?id=${id}`;
  };

  const handleCreateNewList = async () => {
    try {
      const newList = await api.createTodoList('Untitled List');
      goToTodo(newList.id);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setCurrentUser(null);
        setAuthDialogOpen(true);
        showSnackbar('Please log in to continue', 'error');
      } else {
        showSnackbar('Failed to create new list', 'error');
      }
    }
  };

  const handleDeleteClick = (event: React.MouseEvent<HTMLElement>, list: TodoListSummary) => {
    event.stopPropagation();
    setSelectedList(list);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedList) return;

    setDeleting(true);
    try {
      await api.deleteTodoList(selectedList.id);
      setCreatedLists(createdLists.filter(list => list.id !== selectedList.id));
      showSnackbar('Todo list deleted successfully', 'success');
    } catch (error: any) {
      if (error.response?.status === 403) {
        showSnackbar('You can only delete lists you created', 'error');
      } else if (error.response?.status === 401) {
        setCurrentUser(null);
        setAuthDialogOpen(true);
        showSnackbar('Please log in to continue', 'error');
      } else {
        showSnackbar('Failed to delete todo list', 'error');
      }
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedList(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedList(null);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleAuthTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setAuthTab(newValue);
  };

  const renderTodoList = (list: TodoListSummary, isShared: boolean = false) => (
    <Paper
      key={list.id}
      elevation={1}
      sx={{
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        backgroundColor: 'white',
        '&:hover': {
          elevation: 3,
          transform: 'translateY(-1px)',
          backgroundColor: '#fafafa',
        },
      }}
      onClick={() => goToTodo(list.id)}
    >
      <ListItem 
        sx={{ py: 2 }}
        secondaryAction={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              edge="end"
              onClick={(e) => handleViewUsers(e, list)}
              sx={{ color: 'primary.main' }}
              aria-label="view users"
              title="View users in this list"
            >
              <Person />
            </IconButton>
            {!isShared && (
              <IconButton
                edge="end"
                onClick={(e) => handleDeleteClick(e, list)}
                sx={{ color: 'error.main' }}
                aria-label="delete"
                title="Delete this list (only creator can delete)"
              >
                <Delete />
              </IconButton>
            )}
          </Box>
        }
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: isShared ? '#ff9800' : '#424242' }}>
            {isShared ? <ShareIcon /> : <ListAltIcon />}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography variant="h6" fontWeight={500}>
              {list.title}
            </Typography>
          }
          secondary={
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip
                size="small"
                label={`${list.taskCount} task${list.taskCount !== 1 ? 's' : ''}`}
                variant="outlined"
                color="primary"
              />
              <Chip
                size="small"
                label={`${list.userCount} user${list.userCount !== 1 ? 's' : ''}`}
                variant="outlined"
                color="secondary"
              />
              <Chip
                size="small"
                label={isShared ? `Created by ${list.createdByUsername || 'Unknown'}` : "Created by you"}
                variant="filled"
                color={isShared ? "warning" : "success"}
                sx={{ fontSize: '0.7rem' }}
              />
            </Box>
          }
        />
      </ListItem>
    </Paper>
  );

  const UsersDialog = () => (
    <Dialog
      open={usersDialogOpen}
      onClose={() => setUsersDialogOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Typography variant="h6">
          Users in "{selectedListForUsers?.title}"
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {loadingUsers ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : selectedListUsers.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={2}>
            No users found in this list
          </Typography>
        ) : (
          <List>
            {selectedListUsers.map((user, index) => (
              <ListItem key={user.userId || index} divider={index < selectedListUsers.length - 1}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: user.isGuest ? '#ff9800' : '#2196f3' }}>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.username || 'Unknown User'}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {user.isGuest ? 'Guest User' : 'Registered User'}
                      </Typography>
                      {user.joinedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Joined: {new Date(user.joinedAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setUsersDialogOpen(false)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (loading && currentUser) {
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

  if (!currentUser) {
    return (
      <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
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
              Welcome to Todo Lists
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
                </Stack>
              </form>
            </TabPanel>
          </DialogContent>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  const totalLists = createdLists.length + sharedLists.length;

  return (
    <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <AppBar 
        position="static" 
        elevation={1}
        sx={{ backgroundColor: '#424242' }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            My Todo Lists
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              icon={<Person />}
              label={currentUser.username}
              size="small"
              color="secondary"
              variant="outlined"
              onClick={handleLogout}
              clickable
              title={`Logged in as ${currentUser.username}. Click to logout.`}
            />
            <Chip
              label={`${totalLists} list${totalLists !== 1 ? 's' : ''}`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        {totalLists === 0 ? (
          <Box textAlign="center" py={6}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No todo lists yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first todo list to get started, or get someone to share a list with you.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleCreateNewList}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                py: 1.5,
              }}
            >
              Create New List
            </Button>
          </Box>
        ) : (
          <Stack spacing={3}>
            {createdLists.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ListAltIcon />
                  My Lists ({createdLists.length})
                </Typography>
                <Stack spacing={2}>
                  {createdLists.map((list) => renderTodoList(list, false))}
                </Stack>
              </Box>
            )}

            {sharedLists.length > 0 && (
              <Box>
                {createdLists.length > 0 && <Divider sx={{ my: 2 }} />}
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShareIcon />
                  Shared with Me ({sharedLists.length})
                </Typography>
                <Stack spacing={2}>
                  {sharedLists.map((list) => renderTodoList(list, true))}
                </Stack>
              </Box>
            )}

            <Box
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 1000,
              }}
            >
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleCreateNewList}
                sx={{
                  borderRadius: '50%',
                  minWidth: 56,
                  width: 56,
                  height: 56,
                  boxShadow: 3,
                  '&:hover': {
                    boxShadow: 6,
                  },
                }}
              >
                <Add />
              </Button>
            </Box>
          </Stack>
        )}
      </Container>

      <UsersDialog />

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Todo List
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete "{selectedList?.title}"? This action cannot be undone.
            All tasks and users in this list will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <Delete />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};