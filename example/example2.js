var express = require('express');
var app = express();
var io = require('socket.io-client');
var socket;

var host = 'http://localhost';
var port = 3002;

var maestroHost = 'http://localhost:3000';

var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);

    initSocket();
});

app.use(express.static('dist'));

function initSocket() {
    socket = io.connect(maestroHost, {reconnect: true});

    // Add a connect listener
    socket.on('connect', function() {
        console.log('Connected!');
        socket.emit('registerServer');
        socket.emit('setHost', host + ':' + port);
        initMaestroRoutes();
    });

    socket.on('error', function(socket) {
        console.log('connection error', socket);
    });

    socket.on('request', function(request) {
        console.log('Request on socket!',request);
    });
};

function initMaestroRoutes() {
    registerRoute('/example2', function (req, res) {
        res.send("Hello there!");
    });

    registerRoute('/example2/:name', function (req, res) {
        res.send("Hello there " + req.params.name);
    });
};


function registerRoute (route, callback) {
    app.get(route, callback);
    socket.emit('addRoute', route);
};
