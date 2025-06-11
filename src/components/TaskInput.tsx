import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Fab
} from '@mui/material';
import { Add, Send } from '@mui/icons-material';

interface TaskInputProps {
  onAddTasks: (tasks: string[]) => void;
  disabled?: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTasks, disabled }) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = () => {
    if (!input.trim()) return;
    
    const tasks = input
      .split('\n')
      .map(task => task.trim())
      .filter(task => task.length > 0);
    
    if (tasks.length > 0) {
      onAddTasks(tasks);
      setInput('');
      setIsExpanded(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Changed to just Enter (like in TodoList component)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isExpanded) {
    return (
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000
        }}
        onClick={() => setIsExpanded(true)}
      >
        <Add />
      </Fab>
    );
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        p: 3,
        borderRadius: 0,
        borderTop: 1,
        borderColor: 'divider',
        zIndex: 1000,
        backgroundColor: 'white' // Changed to match TodoList component
      }}
      elevation={8}
    >
      <Box maxWidth="md" mx="auto">
        <Typography variant="h6" sx={{ mb: 2 }}>
          Add New Tasks
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
         
        </Typography>
        <Box display="flex" gap={2}>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder=""
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={disabled}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#f8f9fa', 
                '&:hover': {
                  backgroundColor: '#f8f9fa', 
                },
                '&.Mui-focused': {
                  backgroundColor: 'white', 
                },
              },
            }}
          />
          <Box display="flex" flexDirection="column" gap={1}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!input.trim() || disabled}
              startIcon={<Send />}
            >
              Add
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setIsExpanded(false);
                setInput('');
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};