const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

const wss = new WebSocket.Server({ noServer: true });

// Only accept WebSocket upgrade requests on the SAME path `/`
server.on("upgrade", (request, socket, head) => {
  if (request.url === "/") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy(); // reject upgrades on unknown paths
  }
});

// WebSocket connection handling
wss.on("connection", (ws) => {
  console.log("client connected");
  const numClients = wss.clients.size;
  wss.broadcast(`Current visitors: ${numClients}`);

  ws.send("welcome to my server");

  ws.on("close", () => {
    const newNumClients = wss.clients.size;
    wss.broadcast(`Current visitors: ${newNumClients}`);
    console.log("client disconnected");
  });
});

// Broadcast helper
wss.broadcast = function broadcast(data) {
  this.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  });
};

// Start server
server.listen(3000, () => console.log("Server running on port 3000"));
