const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const users = [];

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/webrtc_index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
  });



  socket.on('message', (msg) => {
    console.log('message: from' + socket.username + ', type: '+ msg.type + ' , to :' + msg.to);
    var toUser = msg.to;
    msg.to = socket.username;
    io.to(toUser).emit('message', msg);
  });


  socket.on('register', function(username) {
    console.log('register: ' + username);
    socket.username = username;
    socket.join(username);
    users.push(username);
    io.emit('user_list', users);

});

});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

