const express = require('express');
const { createServer } = require('http');
const { join } = require('path');
const path = require('path');
const { Server } = require('socket.io');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const server = createServer(app);
const io = new Server(server);
const uri = 'mongodb+srv://leonti:admin@leonti.hsmpuzc.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=3600'); // кешировать на 1 час
  next();
});



app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/pages/admin.html');
});
app.get('/admin/dishes', (req, res) => {
  res.sendFile(__dirname + '/pages/dishes.html');
});
app.get('/admin/users', (req, res) => {
  res.sendFile(__dirname + '/pages/users.html');
});
app.get('/admin/menus', (req, res) => {
  res.sendFile(__dirname + '/pages/menus.html');
});


io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
      });

    socket.on('messageFromClient', (data) => {
        io.emit('messageToWorker', data);
      });

      socket.on('messageFromWorker', (selectedBox, price, size) => {
          io.emit('messageToClient', selectedBox, price, size);
        });
      socket.on('functionFromWorker', (data) => {
          io.emit('functionToClient', data);
        });
      socket.on('reloadFromWorker', () => {
          io.emit('reloadToClient');
        });
      
    socket.on('disconnect', () => {
        console.log('User disconnected');
      });
  });

app.use(express.json());

app.get('/api/notes', async (req, res) => {
  try {
    await client.connect();
    const database = client.db('Buffet');
    const collection = database.collection('Dishes');

    const notes = await collection.find({}).sort({ date: 1 }).toArray();
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    // client.close();
  }
});


app.post('/api/addNote', express.json(), async (req, res) => {
  try {
      await client.connect();

      const database = client.db('Buffet');
      const collection = database.collection('Dishes');

      const newNote = {
          date: new Date(req.body.date),
          note: req.body.note,
          amount: req.body.amount,
          type: req.body.type,
          dishType: req.body.dishType,
      };
      await collection.insertOne(newNote);

      res.status(201).send('Note added successfully');
  } catch (error) {
      console.error('Error adding note:', error);
      res.status(500).send('Internal Server Error');
  }
});





app.post('/api/editNote', express.json(), async (req, res) => {
  try {
      await client.connect();

      const database = client.db('Buffet');
      const collection = database.collection('Dishes');

      const { _id, date, newNoteData } = req.body;

      await collection.updateOne(
          { _id: new ObjectId(_id) },
          { $set: { note: newNoteData.note, date: new Date(date) } }
      );

      res.status(200).send('Note edited successfully');
  } catch (error) {
      console.error('Error editing note:', error);
      res.status(500).send('Internal Server Error');
  }
});



app.post('/api/deleteNote', express.json(), async (req, res) => {
  try {
      await client.connect();

      const database = client.db('Buffet');
      const collection = database.collection('Dishes');

      const { _id } = req.body;

      await collection.deleteOne({ _id: new ObjectId(_id) });

      res.status(200).send('Note deleted successfully');
  } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).send('Internal Server Error');
  }
});






app.get('/api/getDishes', async (req, res) => {
  try {
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const database = client.db('Buffet');
    const collection = database.collection('Dishes');

    const notes = await collection.find({}).sort({ date: 1 }).toArray();
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    // client.close();
  }
});

app.post('/api/saveMenu', express.json(), async (req, res) => {
  try {
      const database = client.db('Buffet');
      const dateCollection = database.collection('Date');

      const { day, note } = req.body;
      const menuDate = new Date(day);

      await dateCollection.updateOne({ date: menuDate }, { $set: { date: menuDate, note: note } }, { upsert: true });
      res.status(201).send('Menu saved successfully');
  } catch (error) {
      console.error('Error saving menu:', error);
      res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});


app.get('/api/getMenu', async (req, res) => {
  try {
      await client.connect();
      const database = client.db('Buffet');
      const collection = database.collection('Date');

      const { day } = req.query;

      const menuDate = new Date(day);

      const menu = await collection.findOne({ date: menuDate });

      res.json(menu ? menu.dishes : []);
  } catch (error) {
      console.error('Error fetching menu:', error);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/api/getDishesForDate/:date', async (req, res) => {
    try {
        await client.connect();
        const database = client.db('Buffet');
        const collection = database.collection('Date');

        const date = new Date(req.params.date);
        const dishes = await collection.find({ date: { $eq: date } }).toArray();
        res.json(dishes);
    } catch (error) {
        console.error('Error fetching dishes:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/api/users', async (req, res) => {
  try {
    await client.connect();
    const database = client.db('Buffet');
    const collection = database.collection('Users');

    const users = await collection.find({}).toArray();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/api/deleteNotesBeforeDate/:date', async (req, res) => {
  try {
      const date = new Date(req.params.date);
      await client.connect();
      const database = client.db('Buffet');
      const collection = database.collection('Date');

      const result = await collection.deleteMany({ date: { $lt: date } });
      res.status(200).send(`${result.deletedCount} записей удалено`);
  } catch (error) {
      console.error('Ошибка при удалении записей:', error);
      res.status(500).send('Internal Server Error');
  }
});




app.get('/api/menus', async (req, res) => {
  try {
      await client.connect();
      const collection = client.db("Buffet").collection("Date");
      const menus = await collection.find().toArray();
      res.json(menus);
  } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching menus from database');
  } finally {
      await client.close();
  }
});


const bcrypt = require('bcrypt');

app.post('/login', async (req, res) => {
  client.connect();
  const database = client.db('Buffet');
  const collection = database.collection('Users'); 

  const { username, password } = req.body;

  const user = await collection.findOne({ username: username });
  const hashedPassword = user.password;

  bcrypt.compare(password, hashedPassword, function(err, result) {
      if (result) {
          res.json({ success: true });
      } else {
          res.json({ success: false });
      }
  });
});


server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});