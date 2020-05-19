const express = require("express");
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const formatMessage = require("./utils/messages");
const { getCurrentUser, userJoin, userLeave, getRoomUsers } = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatCord";

io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {

    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));

    // User connects
    socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    })
  })

  // Chat message
  socket.on('chatMessage', (message) => {
    const user = getCurrentUser(socket.id);
    console.log(user);
    io.to(user.room).emit('message', formatMessage(user.username, message));
  })

  // User dsconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      })
    }
    
  });

  
})

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));