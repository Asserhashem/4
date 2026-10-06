const express = require('express');
const cors = require('cors');
const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// تخزين البيانات في الذاكرة
const users = [];
const exercises = {}; // { userId: [ { description, duration, date } ] }

// 1. إنشاء مستخدم جديد: POST /api/users
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  const _id = Date.now().toString();

  const newUser = { username, _id };
  users.push(newUser);
  exercises[_id] = [];

  res.json(newUser);
});

// 2. الحصول على قائمة جميع المستخدمين: GET /api/users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// 3. إضافة تمرين لمستخدم: POST /api/users/:_id/exercises
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const user = users.find(u => u._id === userId);

  if (!user) {
    return res.json({ error: 'User not found' });
  }

  const description = req.body.description;
  const duration = parseInt(req.body.duration, 10);
  
  // ضبط التاريخ بتنسيق toDateString()
  let dateObj = req.body.date ? new Date(req.body.date) : new Date();
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }
  const dateStr = dateObj.toDateString();

  const newExercise = {
    description,
    duration,
    date: dateStr
  };

  if (!exercises[userId]) {
    exercises[userId] = [];
  }
  exercises[userId].push(newExercise);

  res.json({
    _id: user._id,
    username: user.username,
    date: newExercise.date,
    duration: newExercise.duration,
    description: newExercise.description
  });
});

// 4. الحصول على سجل التمارين لمستخدم: GET /api/users/:_id/logs
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const user = users.find(u => u._id === userId);

  if (!user) {
    return res.json({ error: 'User not found' });
  }

  let userExercises = [...(exercises[userId] || [])];

  // التصفية حسب من (from) وإلى (to)
  const { from, to, limit } = req.query;

  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      userExercises = userExercises.filter(e => new Date(e.date) >= fromDate);
    }
  }

  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      userExercises = userExercises.filter(e => new Date(e.date) <= toDate);
    }
  }

  // تحديد عدد النتائج (limit)
  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (!isNaN(limitNum)) {
      userExercises = userExercises.slice(0, limitNum);
    }
  }

  res.json({
    _id: user._id,
    username: user.username,
    count: userExercises.length,
    log: userExercises
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});