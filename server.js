const express = require('express');
const http = require('http');
const { v4: uuidv4 } = require("uuid");
const { Server: SocketServer } = require("socket.io");

const app = express();
const expressServer = http.createServer(app);
const io = new SocketServer(expressServer, {
    cors: {
        origin: '*'
    }
});


//peer
var ExpressPeerServer = require('peer').ExpressPeerServer;
var peerExpress = require('express');
var peerApp = peerExpress();
var peerServer = require('http').createServer(peerApp);
var options = { debug: true }
var peerPort = 3001;
peerApp.use('/peerjs', ExpressPeerServer(peerServer, options));
peerServer.listen(peerPort);


//settings
app.set("view engine", "ejs");
app.use(express.static("public"));

// #region routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/rooms', (req, res) => {
    res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
    res.render("room", { roomId: req.params.room });
});
// #endregion

// start
expressServer.listen(3000, () => {
    console.log('listening on *:3000');
});

// #region sockets
io.on('connection', (socket) => {
    socket.on("room:join", (roomId, userId, userName) => {
        console.log('a user ' + userName + ' connected to room ' + roomId);
        socket.join(roomId);
        socket.to(roomId).emit("room:user-connected", userId);

        socket.on('message:create', (message) => {
            console.log('message to ' + roomId + ': ' + message);            
            io.to(roomId).emit("message:new", message, userName);
        });

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });
});
// #endregion