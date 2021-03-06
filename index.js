// deklarerer variabler
var express = require('express');
var app = express();
var http = require('http').Server(app);
var webSocket = require('socket.io')(http);
var _ = require('lodash');
var path = require('path');

var questions = [];
var voteids = [];
var id = 0;

// setter opp get-funksjon mot nettsiden
app.use('/', express.static(path.join(__dirname, 'public')));

var roomnumber = 1;
// bestemmer port

http.listen(3001,function(){
  console.log('Listening on 3001');
    });

//når klient kobler seg på
webSocket.on('connection',function(socket){
  var address = socket.handshake.address;
  socket.join("room-"+roomnumber);
  webSocket.sockets.in("room-"+roomnumber).emit('connectToRoom', "You are in room no. "+roomnumber);
  console.log('new connection');
  //laste inn tidligere stilte spørsmål
  socket.emit('all questions', JSON.stringify(questions));

  //når det kommer et nytt spørsmål fra klient
  socket.on('new question', function(question){
    var q =
    {
      'text': question,
      'id': id,
      'votes': 0,
      'answered': false
    }

    id++;
    questions.push(q);
    webSocket.emit('new question', JSON.stringify(q));
  });

  //ny stemme
  socket.on('vote', function(vote){
    console.log('vote received');
    var vote = JSON.parse(vote);
    var q = _.find(questions, function(q){
      return q.id == vote.id;
    });
    if(q == null) {
      console.log('question not found');
      return;
    }
    var addressCheck = _.find(voteids, {
      'address' : address,
      'voteid' : vote.id
    });
    if(addressCheck != null) {
      return;
    }
    var addressobj = {'address' : address, 'voteid' : vote.id};
    voteids.push(addressobj);
    if(vote.vote == 'plus') q.votes++;
    console.log('sending vote');
    webSocket.emit('vote', JSON.stringify(q));
  });
});
