import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box
} from '@mui/material';
import { Person } from '@mui/icons-material';

interface UserModalProps {
  open: boolean;
  onSubmit: (username: string) => void;
}

export const UserModal: React.FC<UserModalProps> = ({ open, onSubmit }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmedName = username.trim();
    if (trimmedName.length < 2) {
      setError('Username must be at least 2 characters long');
      return;
    }
    if (trimmedName.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }
    onSubmit(trimmedName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default form submission behavior
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth disableEscapeKeyDown>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Person color="primary" />
          <Typography variant="h6">Welcome to Todo List</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please enter your name to start collaborating on this todo list.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label="Your Name"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError('');
          }}
          onKeyDown={handleKeyDown}
          error={!!error}
          helperText={error}
          variant="outlined"
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          fullWidth
          disabled={!username.trim()}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};