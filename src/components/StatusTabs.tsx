import React from 'react';
import { Tabs, Tab, Badge, Box } from '@mui/material';
import { TaskStatus, Task } from '../types';

interface StatusTabsProps {
  currentStatus: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
  tasks: Task[];
}

export const StatusTabs: React.FC<StatusTabsProps> = ({
  currentStatus,
  onStatusChange,
  tasks
}) => {
  const getTaskCount = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status).length;
  };

  const statusColors = {
    new: '#1976d2',
    open: '#ed6c02',
    closed: '#2e7d32'
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs
        value={currentStatus}
        onChange={(_, value) => onStatusChange(value)}
        variant="fullWidth"
      >
        <Tab
          label={
            <Badge badgeContent={getTaskCount('new')} color="primary">
              <Box sx={{ color: currentStatus === 'new' ? statusColors.new : 'text.secondary' }}>
                New
              </Box>
            </Badge>
          }
          value="new"
        />
        <Tab
          label={
            <Badge badgeContent={getTaskCount('open')} color="warning">
              <Box sx={{ color: currentStatus === 'open' ? statusColors.open : 'text.secondary' }}>
                Open
              </Box>
            </Badge>
          }
          value="open"
        />
        <Tab
          label={
            <Badge badgeContent={getTaskCount('closed')} color="success">
              <Box sx={{ color: currentStatus === 'closed' ? statusColors.closed : 'text.secondary' }}>
                Closed
              </Box>
            </Badge>
          }
          value="closed"
        />
      </Tabs>
    </Box>
  );
};