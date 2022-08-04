const http = require('http');
const Koa = require('koa');
const cors = require('koa2-cors');
const uuid = require('uuid');

const WS = require('ws');
const app = new Koa();

const Clients = require('./clients');
const clients = new Clients();

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());
const wsServer = new WS.Server({ server });

app.use(
  cors({
    origin: '*',
    credentials: true,
    'Access-Control-Allow-Origin': true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

wsServer.on('connection', (ws) => {
  const id = uuid.v4();
  ws.on('message', (msg) => {
    const request = JSON.parse(msg);
    switch (request.event) {
      case 'connected':
        if (clients.checkNikName(request.message)) {
          ws.close(1000, 'Выберите другое имя');
        } else {
          ws.name = request.message;
          clients.items[id] = ws;
          clients.sendValidOk(ws);
          clients.sendOldMsg(ws);
          clients.sendAllClientEvent();
        }
        break;
      case 'message':
        clients.sendAllNewMsg(request);
        clients.message.push({ ['nikName']: clients.items[id].name, ['message']: request.message, ['date']: request.date });
        break
      default:
        break;
    }
  });

  ws.on('close', () => {
    if (typeof clients.items[id] !== "undefined") {
      delete clients.items[id];
      clients.sendAllClientEvent();
    }
  });
});

server.listen(port, () => console.log(`Server has been started on ${port}...`));