var express = require('express');
var underscore = require('underscore');
var app = express();
var http = require('http');

var server = http.createServer(app).listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Maestro listening at http://%s:%s', host, port);
});

var io = require('socket.io')(server);
io = io.listen(server);

function Maestro (io) {
    this._servers = [];
    this.inspectorSocket = null;

    this.registerServer = function (socket) {
        console.log('Creating new client for socket id: ' + socket.id);

        var server = new MaestroClient(socket);

        this._servers.push(server);
        this.updateServers();
    };

    this.unregisterServer = function (socketId) {
        console.log('Removing client for socket id: ' + socketId);
        for (var i = this._servers.length - 1; i >= 0; i--) {
            if (this._servers[i].id === socketId) {
                this._servers[i].removeRoutes();
                this._servers.splice(i, 1);
            }
        };
        this.updateServers();
    };

    this.inspectorConnected = function (socket) {
        this.inspectorSocket = socket;
        this.updateServers();
    };

    this.updateServers = function () {
        if (!this.inspectorSocket) {
            return;
        }

        var servers = [];

        for (var i = this._servers.length - 1; i >= 0; i--) {
            var server = {
                host: this._servers[i].host,
                routes: []
            };

            for (var j = this._servers[i].routes.length - 1; j >= 0; j--) {
                server.routes.push({
                    path: this._servers[i].routes[j].path
                });
            };

            servers.push(server);
        };

        this.inspectorSocket.emit('serversUpdated', servers);
    };

    underscore.bindAll(this, 'unregisterServer', 'registerServer', 'inspectorConnected', 'updateServers');

    // Add a connect listener
    io.sockets.on('connection', function (socket) {
        socket.on('inspectorConnected', function () {
            maestro.inspectorConnected(this);
        });
        socket.on('registerServer', function() {
            maestro.registerServer(this);
        });
    });

    console.log('Maestro ready and listening');

    return this;
};

var maestro = new Maestro(io);

function MaestroRoute (path) {
    this.path = path;
    this.queue = [];

    this.queueRequest = function (request) {
        this.queue.push(request);
        console.log('Request queued',request.req.route.path);
    };

    this.destroy = function () {
        for (var i = app._router.stack.length - 1; i >= 0; i--) {
            if (app._router.stack[i].route) {
                if (app._router.stack[i].route.path === this.path) {
                    console.log('Removing route ' + this.path);
                    app._router.stack.splice(i, 1);
                }
            }
        };
    };

    console.log('Route created for ' + this.path);
    return this;
};

function MaestroRequest (expressRequest) {
    return {
        body: expressRequest.body,
        cookies: expressRequest.cookies,
        params: expressRequest.params,
        query: expressRequest.query,
        path: expressRequest.route.path
    }
};

function MaestroClient (socket) {
    this.id = socket.id;
    this.socket = socket;
    this.routes = [];
    this.host = '';

    this.removeRoutes = function () {
        console.log('Clearing all registered routes.');

        // Unregister all routes.
        for (var i = this.routes.length - 1; i >= 0; i--) {
            this.routes[i].destroy();
        };
        maestro.updateServers();
    };

    this.addRoute = function (route) {
        var maestroRoute = new MaestroRoute(route);
        app.get(route, this.requestRecived);

        this.routes.push(maestroRoute);
        maestro.updateServers();
    };

    this.requestRecived = function (req, res) {
        console.log('Proxy request for: ' + req.route.path);
        for (var i = this.routes.length - 1; i >= 0; i--) {
            if (this.routes[i].path === req.route.path) {
                res.redirect(this.host + req.path);
                // this.routes[i].queueRequest({req: req, res: res});
                // this.socket.emit('request', new MaestroRequest(this.routes[i].queue[0].req));
            }
        };
    };

    this.setHost = function (host) {
        this.host = host;
        maestro.updateServers();
    };

    underscore.bindAll(this, 'addRoute', 'requestRecived', 'setHost');

    this.socket.on('addRoute', this.addRoute);

    this.socket.on('setHost', this.setHost);

    this.socket.on('disconnect', function () {
        maestro.unregisterServer(this.id);
    });

    this.socket.on('error', function(error) {
        console.log('Error.', error);
    });

    return this;
};


app.use('/inspector/', express.static('inspector/dist/'));

app.get('/inspector', function (req, res) {
    res.sendFile(__dirname + '/inspector/dist/index.html');
});

app.get('/servers', function routesCallback(req, res) {
    var servers = [];

    for (var i = maestro._servers.length - 1; i >= 0; i--) {
        servers.push({
            socketId: maestro._servers[i].id,
            routes: maestro._servers[i].routes
        });
    };

    res.send(servers);
});
