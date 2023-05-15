const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const fs = require('fs');
const https = require('https');

const app = express();
const port = 443;

app.use(bodyParser.json());
app.use(morgan('combined'));
app.use(helmet());

const options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.crt')
};

const server = https.createServer(options, app);





const users = [];

app.use(express.static('public'));
const { Server } = require("socket.io");
const io = new Server(server);
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



server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

