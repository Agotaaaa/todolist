import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { TodoList } from './components/TodoList';
import { TodoOverview } from './components/TodoOverview';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { LoginPage } from './components/Login';
const TodoListWithNavigation = () => {
  const navigate = useNavigate();

  const handleNewListCreated = (id: string) => {
    navigate(`/todo?id=${id}`);
  };

  return <TodoList onNewListCreated={handleNewListCreated} />;
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<TodoOverview />} />
          <Route path="/todo" element={<TodoListWithNavigation />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
