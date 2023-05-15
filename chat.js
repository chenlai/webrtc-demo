const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const users = [];


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/chat.html');
  });

io.on('connection', function(socket) {
    console.log('a user connected');

    socket.on('register', function(username) {
        console.log('register: ' + username);
        socket.username = username;
        socket.join(username);
        users.push(username);
        io.emit('user_list', users);
    });

    socket.on('private_message', function(data) {
        console.log('private_message: ' + data.message + ' to ' + data.to);
        const fromUser = socket.username;
        const toUser = data.to;
        const message = data.message;
        io.to(toUser).emit('private_message', {from: fromUser, message: message});
    });

    socket.on('disconnect', function() {
        console.log('user disconnected');
        const index = users.indexOf(socket.username);
        if (index > -1) {
            users.splice(index, 1);
            io.emit('user_list', users);
        }
    });
});

server.listen(3000, function() {
    console.log('listening on *:3000');
});