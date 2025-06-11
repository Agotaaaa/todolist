import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton
} from '@mui/material';
import {
  Person,
  CalendarToday,
  Delete
} from '@mui/icons-material';
import { Task, TaskStatus } from '../types';

interface TaskItemProps {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDeadlineChange: (taskId: string, deadline: string) => void;
  onDelete: (taskId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onStatusChange,
  onDeadlineChange,
  onDelete
}) => {
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false);
  const [deadline, setDeadline] = useState(task.deadline || '');

  const statusColors = {
    new: 'primary',
    open: 'warning',
    closed: 'success'
  } as const;

  const handleStatusClick = () => {
    // Cycle through statuses: new -> open -> closed -> new
    const statusOrder: TaskStatus[] = ['new', 'open', 'closed'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    onStatusChange(task.id, statusOrder[nextIndex]);
  };

  const handleDeadlineSubmit = () => {
    onDeadlineChange(task.id, deadline);
    setDeadlineDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'closed';

  return (
    <>
      <Card 
        sx={{ 
          mb: 2,
          backgroundColor: isOverdue ? '#ffebee' : 'inherit',
          borderRadius: 0
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                {task.text}
              </Typography>
              
              <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
                <Chip
                  label={task.status.charAt(0).toUpperCase()}
                  color={statusColors[task.status]}
                  size="small"
                  onClick={handleStatusClick}
                  sx={{ cursor: 'pointer', minWidth: '32px' }}
                />
                
                <Chip
                  icon={<Person />}
                  label={task.createdBy}
                  variant="outlined"
                  size="small"
                />
                
                {task.lastUpdatedBy && task.lastUpdatedBy !== task.createdBy && (
                  <Chip
                    icon={<Person />}
                    label={`Updated by ${task.lastUpdatedBy}`}
                    variant="outlined"
                    size="small"
                    color="secondary"
                  />
                )}
                
                {task.deadline && (
                  <Chip
                    icon={<CalendarToday />}
                    label={`Due: ${formatDate(task.deadline)}`}
                    variant="outlined"
                    size="small"
                    color={isOverdue ? 'error' : 'default'}
                  />
                )}
              </Box>
            </Box>
            
            {/* Action chips on the right */}
            <Box display="flex" flexWrap="wrap" gap={1} alignItems="center" sx={{ ml: 2 }}>
              {task.status !== 'open' && (
                <Chip
                  label="MO"
                  variant="outlined"
                  size="small"
                  onClick={() => onStatusChange(task.id, 'open')}
                  sx={{ cursor: 'pointer', color: 'warning.main', borderColor: 'warning.main', minWidth: '32px' }}
                />
              )}
              
              {task.status !== 'closed' && (
                <Chip
                  label="MC"
                  variant="outlined"
                  size="small"
                  onClick={() => onStatusChange(task.id, 'closed')}
                  sx={{ cursor: 'pointer', color: 'success.main', borderColor: 'success.main', minWidth: '32px' }}
                />
              )}
              
              <Chip
                label={task.deadline ? 'ED' : 'SD'}
                variant="outlined"
                size="small"
                onClick={() => setDeadlineDialogOpen(true)}
                sx={{ cursor: 'pointer', color: 'primary.main', minWidth: '32px' }}
              />
              
              <IconButton
                onClick={() => onDelete(task.id)}
                size="small"
                sx={{ color: 'error.main' }}
              >
                <Delete />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Dialog 
        open={deadlineDialogOpen} 
        onClose={() => setDeadlineDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Set Task Deadline</DialogTitle>
        <DialogContent sx={{ minHeight: '120px', pt: 3 }}>
          <TextField
            type="date"
            label="Deadline"
            fullWidth
            value={deadline ? deadline.split('T')[0] : ''}
            onChange={(e) => setDeadline(e.target.value ? new Date(e.target.value).toISOString() : '')}
            sx={{ mt: 1 }}
            InputLabelProps={{ shrink: true }}
            size="medium"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setDeadlineDialogOpen(false)} 
            size="large"
            sx={{ color: '#424242' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              onDeadlineChange(task.id, '');
              setDeadline('');
              setDeadlineDialogOpen(false);
            }}
            size="large"
            sx={{ color: '#424242' }}
          >
            Clear
          </Button>
          <Button 
            onClick={handleDeadlineSubmit} 
            variant="contained" 
            size="large"
            sx={{ backgroundColor: '#424242' }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};