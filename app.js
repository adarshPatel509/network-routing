let express = require('express');
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
let path = require('path');
let ss = require('socket.io-stream');
let fs = require('fs');
let lineReader = require('line-reader');

app.use(express.static('public'))

app.get('/*', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

//sotres client socket address
let cleintsMap = {};
let routingTable = "";

io.on('connection', function(socket){
  console.log('New Connection!!');
  
  //handeling fileUpload
  ss(socket).on('sendFile', function(stream, data) {
    console.log("Recieved file ", data.name, " from ", data.from, " to send at node ", data.to);
    var filename = path.basename(data.name);
    stream.pipe(fs.createWriteStream(filename))
    .on('finish', function() {
       //sendFile to destination node line by line
        lineReader.eachLine(data.name, function(line, last) {
        console.log(line, "\n");
        let message = {message: line, from: data.from}
        if(cleintsMap[data.to] == undefined) {
          console.log("Destination node ", to ," not found");
        } 
        else {
          cleintsMap[data.to].socket.emit('messageFromServer', message);
          if(last) {
            console.log("File send to destination node successfully!");
          }
        }
      });
    });
  });

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