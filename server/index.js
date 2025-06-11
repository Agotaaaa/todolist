import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'server/data');
try {
  await fs.access(dataDir);
} catch {
  await fs.mkdir(dataDir, { recursive: true });
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

// Helper function to get all todo lists for a specific user
async function getAllTodoLists(userId) {
  try {
    const files = await fs.readdir(dataDir);
    const todoFiles = files.filter(file => file.endsWith('.json') && file !== 'index.json');
    const todoLists = [];
    
    for (const file of todoFiles) {
      const todoList = await readJSONFile(file);
      if (todoList && todoList.createdBy === userId) { // Filter by creator
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

// Routes

// Get all todo lists for a specific user
app.get('/api/todos', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    let todoLists;
    if (!userId || userId === 'undefined' || userId === 'null') {
      todoLists = await getPublicTodoLists(); // Returns public todos
    } else {
      todoLists = await getAllTodoLists(userId);
    }

    res.json(todoLists);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});



// Create new todo list
app.post('/api/todos', async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const todoId = uuidv4();
    
    const newTodoList = {
      id: todoId,
      title: title || 'New Todo List',
      tasks: [],
      users: [],
      createdBy: userId, // Store who created this list
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await writeJSONFile(`${todoId}.json`, newTodoList);
    res.json(newTodoList);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific todo list (allow public access if no user ID provided)
// Get specific todo list (allow public access if no user ID provided)
app.get('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    
    const todoList = await readJSONFile(`${id}.json`);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }
    
    // FIXED: Allow public access when no user ID is provided
    // This should always return the todo list for public sharing
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.json(todoList);
    }
    
    // If user ID is provided, verify they have access
    const isCreator = todoList.createdBy === userId;
    const isMember = todoList.users.some(user => user.userId === userId);
    
    // Allow access if user is creator or member
    if (isCreator || isMember) {
      return res.json(todoList);
    }
    
    // If user has ID but isn't creator/member, still allow public read access
    // This ensures shared links work even if the user has a stored ID
    return res.json(todoList);
    
  } catch (error) {
    console.error('Error in GET /api/todos/:id:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update todo list title (only creator can update)
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const todoList = await readJSONFile(`${id}.json`);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }
    
    // Check if user is the creator
    if (todoList.createdBy !== userId) {
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
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const todoList = await readJSONFile(`${id}.json`);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }
    
    // Check if user is the creator
    if (todoList.createdBy !== userId) {
      return res.status(403).json({ error: 'Only the creator can delete the list' });
    }
    
    await fs.unlink(path.join(dataDir, `${id}.json`));
    res.json({ message: 'Todo list deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add user to todo list - FIXED for public access
app.post('/api/todos/:id/users', async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;
    let userId = req.headers['x-user-id'];

    // Generate user ID if not provided (for new users joining via shared link)
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    const todoList = await readJSONFile(`${id}.json`);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }

    // Add user if not already a member
    if (!todoList.users.find(user => user.userId === userId)) {
      todoList.users.push({
        username,
        userId,
        joinedAt: new Date().toISOString()
      });
      todoList.updatedAt = new Date().toISOString();
      await writeJSONFile(`${id}.json`, todoList);
    }

    // Return the updated todo list along with the generated user ID
    res.json({
      ...todoList,
      generatedUserId: userId // Include this so frontend can store it
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add tasks (creator or members can add)
app.post('/api/todos/:id/tasks', async (req, res) => {
  try {
    const { id } = req.params;
    const { tasks, username } = req.body;
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
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

// Update task status (creator or members can update)
app.put('/api/todos/:id/tasks/:taskId', async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const { status, username, deadline } = req.body;
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
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
    
    if (status) task.status = status;
    if (deadline !== undefined) task.deadline = deadline;
    if (username) task.lastUpdatedBy = username;
    task.updatedAt = new Date().toISOString();
    
    todoList.updatedAt = new Date().toISOString();
    
    await writeJSONFile(`${id}.json`, todoList);
    res.json(todoList);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete task (creator or members can delete)
app.delete('/api/todos/:id/tasks/:taskId', async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
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
    
    todoList.tasks = todoList.tasks.filter(t => t.id !== taskId);
    todoList.updatedAt = new Date().toISOString();
    
    await writeJSONFile(`${id}.json`, todoList);
    res.json(todoList);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});