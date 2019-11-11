var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var path = require('path');

app.get('/*', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

//sotres client socket address
let cleintsMap = {};
let routingTable = "";

io.on('connection', function(socket){
  console.log('New Connection!!');
  //handle client echo message
  socket.on("helloFromClient", function(nodeName, nodeDistance) {
      cleintsMap[nodeName] = {socket: socket, distance: nodeDistance};
      console.log("NewNode: ", nodeName, " at Distance: ", nodeDistance);
      routingTable += `  ${nodeName}      ${nodeDistance} \n`;
      console.log("Routing Table: \n", "NODE    DISTANCE\n", routingTable);
  });
  //handle sendMessage event
  socket.on("sendMessage", function(message, from, to) {
      console.log("NewMessage ", message, " from ", from, " to ", to);
      //send message to destination node
      let data = {message: message, from: from};
      if(to == "S") {
        console.log("Message for server!");
      }
      else if(cleintsMap[to] == undefined) {
        console.log("Destination node ", to ," not found");
      }
      else {
        console.log("Message forwarded by server to ", to);
        cleintsMap[to].socket.emit("messageFromServer", data);
      }
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});