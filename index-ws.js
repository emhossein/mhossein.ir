const express = require("express");
const server = require("http").createServer();
const app = express();

app.get("/", function (req, res) {
  res.sendFile("index.html", { root: __dirname });
});

server.on("request", app);
server.listen(3000, function () {
  console.log("server started on port 3000.");
});

// begin websocket

const WebSocketServer = require("ws").Server;

const wss = new WebSocketServer({ server: server });

wss.on("connection", function connection(ws) {
  const numClients = wss.clients.size;
  console.log("clients connected", numClients);

  wss.broadcast(`Current visiters: ${numClients}`);

  if (ws.readyState === ws.OPEN) {
    ws.send("welcome to my server");
  }
  ws.on("close", function close() {
    wss.broadcast(`Current visiters: ${numClients}`);
    console.log("a client has disconnected");
  });
});

wss.broadcast = function broadcast(data) {
  wss,
    this.clients.forEach(function each(client) {
      client.send(data);
    });
};
