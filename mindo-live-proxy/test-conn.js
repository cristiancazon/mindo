const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080');
ws.on('open', () => {
    ws.send(JSON.stringify({ type: 'setup', age: 8, name: 'Test User' }));
});
ws.on('message', (msg) => {
    console.log("Msg:", msg.toString());
});
ws.on('close', () => {
    console.log("Closed.");
    process.exit(0);
});
