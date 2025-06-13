import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Data directory path
const dataDir = path.join(process.cwd(), 'server/data');

// Initialize server function
async function initializeServer() {
  try {
    // Ensure data directory exists
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
    
    console.log('Data directory initialized');
  } catch (error) {
    console.error('Failed to initialize data directory:', error);
  }
}

// Helper function to read JSON file
async function readJSONFile(filename) {
  try {
    const data = await fs.readFile(path.join(dataDir, filename), 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Helper function to write JSON file
async function writeJSONFile(filename, data) {
  await fs.writeFile(path.join(dataDir, filename), JSON.stringify(data, null, 2));
}

// Get or create users file
async function getUsersData() {
  let users = await readJSONFile('users.json');
  if (!users) {
    users = [];
    await writeJSONFile('users.json', users);
  }
  return users;
}

// Helper function to write users data
async function writeUsersData(users) {
  await writeJSONFile('users.json', users);
}

// Helper function to get all todo lists for a specific user
async function getAllTodoLists(userId) {
  try {
    const files = await fs.readdir(dataDir);
    const todoFiles = files.filter(file => file.endsWith('.json') && file !== 'users.json');
    const todoLists = [];
    
    for (const file of todoFiles) {
      const todoList = await readJSONFile(file);
      if (todoList && todoList.createdBy === userId) {
        todoLists.push({
          id: todoList.id,
          title: todoList.title,
          createdAt: todoList.createdAt,
          updatedAt: todoList.updatedAt,
          taskCount: todoList.tasks ? todoList.tasks.length : 0,
          userCount: todoList.users ? todoList.users.length : 0,
          createdBy: todoList.createdBy
        });
      }
    }
    
    return todoLists.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    return [];
  }
}

// Helper function to get shared todo lists for a user
async function getSharedTodoLists(userId) {
  try {
    const files = await fs.readdir(dataDir);
    const todoFiles = files.filter(file => file.endsWith('.json') && file !== 'users.json');
    const sharedLists = [];
    
    for (const file of todoFiles) {
      const todoList = await readJSONFile(file);
      if (todoList && todoList.createdBy !== userId) {
        // Check if user is a member of this list
        const isMember = todoList.users && todoList.users.some(user => user.userId === userId);
        if (isMember) {
          sharedLists.push({
            id: todoList.id,
            title: todoList.title,
            createdAt: todoList.createdAt,
            updatedAt: todoList.updatedAt,
            taskCount: todoList.tasks ? todoList.tasks.length : 0,
            userCount: todoList.users ? todoList.users.length : 0,
            createdBy: todoList.createdBy,
            createdByUsername: todoList.createdByUsername
          });
        }
      }
    }
    
    return sharedLists.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    return [];
  }
}

// Authentication Routes

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    const users = await getUsersData();
    
    // Check if user already exists
    const existingUser = users.find(user => user.username.toLowerCase() === username.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = {
      id: uuidv4(),
      username: username.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    await writeJSONFile('users.json', users);
    
    // Return user info without password
    res.json({
      id: newUser.id,
      username: newUser.username,
      createdAt: newUser.createdAt
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const users = await getUsersData();
    
    // Find user
    const user = users.find(user => user.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Return user info without password
    res.json({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Middleware to authenticate user
async function authenticateUser(req, res, next) {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const users = await getUsersData();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid user authentication' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
}

// Todo Routes (updated to use authentication)

// Get all todo lists for authenticated user - FIXED: Single route definition
app.get('/api/todos', authenticateUser, async (req, res) => {
  try {
    let createdLists = [];
    let sharedLists = [];

    // Only get lists for authenticated users
    if (req.user && req.user.id) {
      createdLists = await getAllTodoLists(req.user.id);
      sharedLists = await getSharedTodoLists(req.user.id);
    }

    res.json({
      created: createdLists,
      shared: sharedLists
    });
  } catch (error) {
    console.error('Error getting todo lists:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new todo list
app.post('/api/todos', authenticateUser, async (req, res) => {
  try {
    const { title } = req.body;
    const todoId = uuidv4();
    
    const newTodoList = {
      id: todoId,
      title: title || 'New Todo List',
      tasks: [],
      users: [],
      createdBy: req.user.id,
      createdByUsername: req.user.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await writeJSONFile(`${todoId}.json`, newTodoList);
    res.json(newTodoList);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific todo list (allow public access for sharing)
app.get('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    
    const todoList = await readJSONFile(`${id}.json`);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }
    
    // Allow public access for sharing
    if (!userId) {
      return res.json(todoList);
    }
    
    // If user is authenticated, verify they have access
    const users = await getUsersData();
    const user = users.find(u => u.id === userId);
    
    if (user) {
      const isCreator = todoList.createdBy === userId;
      const isMember = todoList.users.some(u => u.userId === userId);
      
      if (isCreator || isMember) {
        return res.json(todoList);
      }
    }
    
    // Allow public read access for sharing
    res.json(todoList);
    
  } catch (error) {
    console.error('Error in GET /api/todos/:id:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update todo list title (only creator can update)
app.put('/api/todos/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    const todoList = await readJSONFile(`${id}.json`);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }
    
    // Check if user is the creator
    if (todoList.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Only the creator can update the list title' });
    }
    
    todoList.title = title;
    todoList.updatedAt = new Date().toISOString();
    
    await writeJSONFile(`${id}.json`, todoList);
    res.json(todoList);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete todo list (only creator can delete)
app.delete('/api/todos/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const todoList = await readJSONFile(`${id}.json`);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }
    
    // Check if user is the creator
    if (todoList.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Only the creator can delete the list' });
    }
    
    await fs.unlink(path.join(dataDir, `${id}.json`));
    res.json({ message: 'Todo list deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add user to todo list
app.post('/api/todos/:id/users', async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;
    let userId = req.headers['x-user-id'];
    let userRecord = null;

    // If user is authenticated, get their record
    if (userId) {
      const users = await getUsersData();
      userRecord = users.find(u => u.id === userId);
    }

    const todoList = await readJSONFile(`${id}.json`);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }

    // Generate guest user ID if not authenticated
    if (!userId) {
      userId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Add user if not already a member
    if (!todoList.users.find(user => user.userId === userId)) {
      todoList.users.push({
        username: userRecord ? userRecord.username : username,
        userId,
        isGuest: !userRecord,
        joinedAt: new Date().toISOString()
      });
      todoList.updatedAt = new Date().toISOString();
      await writeJSONFile(`${id}.json`, todoList);

      // Add the list to user's shared lists if they're authenticated
      if (userRecord) {
        const users = await getUsersData();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          if (!users[userIndex].sharedLists) {
            users[userIndex].sharedLists = [];
          }
          if (!users[userIndex].sharedLists.includes(id)) {
            users[userIndex].sharedLists.push(id);
            await writeUsersData(users);
          }
        }
      }
    }

    res.json({
      ...todoList,
      generatedUserId: userId
    });
  } catch (error) {
    console.error('Error adding user to todo list:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
// Get users from todo list
app.get('/api/todos/:id/users', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    
    const todoList = await readJSONFile(`${id}.json`);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }
    
    // Check if user has access to this todo list
    const isOwner = todoList.createdBy === userId;
    const isMember = todoList.users.some(user => user.userId === userId);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Return users list with sanitized data
    const users = todoList.users.map(user => ({
      username: user.username,
      userId: user.userId,
      isGuest: user.isGuest,
      joinedAt: user.joinedAt,
    }));
    
    res.json({
      todoListId: id,
      todoListTitle: todoList.title,
      users: users,
      totalUsers: users.length
    });
    
  } catch (error) {
    console.error('Error fetching todo list users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add tasks (authenticated users and members can add)
app.post('/api/todos/:id/tasks', async (req, res) => {
  try {
    const { id } = req.params;
    const { tasks, username } = req.body;
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const todoList = await readJSONFile(`${id}.json`);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }
    
    // Check if user is creator or member
    const isCreator = todoList.createdBy === userId;
    const isMember = todoList.users.some(user => user.userId === userId);
    
    if (!isCreator && !isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const newTasks = tasks.map(taskText => ({
      id: uuidv4(),
      text: taskText.trim(),
      status: 'new',
      createdBy: username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    todoList.tasks.push(...newTasks);
    todoList.updatedAt = new Date().toISOString();
    
    await writeJSONFile(`${id}.json`, todoList);
    res.json(todoList);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update task status/text/deadline
app.put('/api/todos/:id/tasks/:taskId', async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const { status, username, deadline, text } = req.body;
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const todoList = await readJSONFile(`${id}.json`);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }
    
    // Check if user is creator or member
    const isCreator = todoList.createdBy === userId;
    const isMember = todoList.users.some(user => user.userId === userId);
    
    if (!isCreator && !isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const task = todoList.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Update task properties
    if (status) task.status = status;
    if (deadline !== undefined) task.deadline = deadline;
    if (text !== undefined) task.text = text.trim();
    if (username) task.lastUpdatedBy = username;
    task.updatedAt = new Date().toISOString();
    
    todoList.updatedAt = new Date().toISOString();
    
    await writeJSONFile(`${id}.json`, todoList);
    res.json(todoList);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete task


// Your existing routes and logic
app.delete('/api/todos/:id/tasks/:taskId', async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const todoList = await readJSONFile(`${id}.json`);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }

    const isCreator = todoList.createdBy === userId;
    const isMember = todoList.users.some(user => user.userId === userId);

    if (!isCreator && !isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    todoList.tasks = todoList.tasks.filter(t => t.id !== taskId);
    todoList.updatedAt = new Date().toISOString();

    await writeJSONFile(`${id}.json`, todoList);
    res.json(todoList);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve Vite static files (after all API routes)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing (also after all API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Async initialization and server start
async function startServer() {
  await initializeServer();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  POST /api/auth/register - Register new user');
    console.log('  POST /api/auth/login - Login user');
    console.log('  GET /api/todos - Get user\'s todo lists');
    console.log('  POST /api/todos - Create new todo list');
    console.log('  GET /api/todos/:id - Get specific todo list');
  });
}
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
