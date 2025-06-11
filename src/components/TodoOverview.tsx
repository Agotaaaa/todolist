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
  Skeleton,
  ListItemAvatar,
  Avatar,
  AppBar,
  Toolbar,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { Add, Delete, Person } from '@mui/icons-material';

export const TodoOverview: React.FC = () => {
  const [lists, setLists] = useState<TodoListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<TodoListSummary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
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
    // Get current user ID
    const userId = api.getCurrentUserId();
    setCurrentUserId(userId);
    loadTodoLists();
  }, []);

  const loadTodoLists = async () => {
    try {
      const todoLists = await api.getAllTodoLists();
      setLists(todoLists);
    } catch (error) {
      if (error.response?.status === 400) {
        showSnackbar('User identification required', 'error');
      } else {
        showSnackbar('Failed to load todo lists', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const goToTodo = (id: string) => {
    window.location.href = `/todo?id=${id}`;
  };

  const handleCreateNewList = async () => {
    try {
      const newList = await api.createTodoList('Untitled List');
      goToTodo(newList.id);
    } catch (error) {
      if (error.response?.status === 400) {
        showSnackbar('User identification required', 'error');
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
      setLists(lists.filter(list => list.id !== selectedList.id));
      showSnackbar('Todo list deleted successfully', 'success');
    } catch (error) {
      if (error.response?.status === 403) {
        showSnackbar('You can only delete lists you created', 'error');
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

  const formatUserId = (userId: string): string => {
    // Show only last 8 characters for display
    return userId.length > 8 ? `...${userId.slice(-8)}` : userId;
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
              label={formatUserId(currentUserId)}
              size="small"
              color="secondary"
              variant="outlined"
              title={`User ID: ${currentUserId}`}
            />
            <Chip
              label={`${lists.length} list${lists.length !== 1 ? 's' : ''}`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        {lists.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No todo lists yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first todo list to get started. Only you will see the lists you create.
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
          <>
            
            
            <Stack spacing={2}>
              {lists.map((list) => (
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
                      <IconButton
                        edge="end"
                        onClick={(e) => handleDeleteClick(e, list)}
                        sx={{ color: 'error.main' }}
                        aria-label="delete"
                        title="Delete this list (only creator can delete)"
                      >
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#424242' }}>
                        <ListAltIcon />
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
                            label="Created by you"
                            variant="filled"
                            color="success"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                </Paper>
              ))}
            </Stack>

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
          </>
        )}
      </Container>

      {/* Delete Confirmation Dialog */}
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

      {/* Snackbar for notifications */}
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