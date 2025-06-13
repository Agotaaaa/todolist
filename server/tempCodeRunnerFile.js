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
      // Don't expose sensitive data like email, etc.
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