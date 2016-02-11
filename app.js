/* jshint node: true */
var express = require('express');
var app = express();
var httpServer = require("http").Server(app);
var io = require("socket.io")(httpServer);
var mongoose = require('mongoose');
var loggedInArbiters = [];
var randomizedArbiters = [1,2,3,4,5];
var actualHorse = 0;

var port = process.env.PORT || 3000;

app.use('/lib/', express.static(__dirname + '/bower_components/jquery/dist/'));
app.use(express.static(__dirname + '/public'));

/*-------------------------------------------------------------------------------------------------------------------*/
//łączenie do mongo db
mongoose.connect('mongodb://localhost/horseman', function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log('Connected to the database');
    }
});

/*-------------------------------------------------------------------------------------------------------------------*/
//klasy w mongodb
var horses = mongoose.model('horse', new mongoose.Schema({
    id : String,
    name: String,
}));

var scores = mongoose.model('score', new mongoose.Schema({
    id : String,
    horseId : String,
    arbiterId: String,
    t: String,
    g: String,
    k: String,
    n: String,
    r: String,
}));

var arbiters = mongoose.model('arbiter', new mongoose.Schema({
    id : String,
    secret: String,
}));

/*-------------------------------------------------------------------------------------------------------------------*/
//crud do DB
/*----------HORSE-----------*/
var addHorse = function(Id,Name) {
    new horses({
        id:          Id,
        name:         Name,
        }).save(function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("Dodano konia " + Id + " " + Name );
        }
    });
};

var deleteHorse = function(Id) {
    horses.find({ id: Id }, function(err) {
        if(err) {
            console.log('problem z pobraniem');
        }
    }).remove(function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("usunieto");
        }
    });
};

var editHorse = function(Id, Name) {
    horses.find({ id: Id }, function(err, result) {
        if(err) {
            console.log(err);
        } else {
            console.log(result);
        }
    }).update({
        id: Id,
        name: Name,
    });
};

/*----------SCORE-----------*/
var addScore = function(Id,HorseId,ArbiterId,T,G,K,N,R) {
    new scores({
        id : Id,
        horseId : HorseId,
        arbiterId: ArbiterId,
        t: T,
        g: G,
        k: K,
        n: N,
        r: R,
    }).save(function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("Dodano wynik dla konia o id " + HorseId );
        }
    });
};

var deleteScore = function(Id) {
    scores.find({ id: Id }, function(err) {
        if(err) {
            console.log('problem z pobraniem');
        }
    }).remove(function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("usunieto");
        }
    });
};

var editScore = function(number, horseName) {
    scores.find({ id: number }, function(err, result) {
        if(err) {
            console.log(err);
        } else {
            console.log(result);
        }
    }).update({
        id: id,
        name: horseName,
    });
};

/*----------ARBITER-----------*/

var addArbiter = function(Id,Secret) {
    new arbiters({
        id : Id,
        secret: Secret,
    }).save(function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("Dodano arbitra numer " + Id );
        }
    });
};

var deleteArbiter = function(Id) {
    arbiters.find({ id: Id }, function(err) {
        if(err) {
            console.log('problem z pobraniem');
        }
    }).remove(function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("usunieto");
        }
    });
};

var editArbiter = function(Id, Secret) {
    arbiters.find({ id: Id }, function(err, result) {
        if(err) {
            console.log(err);
        } else {
            console.log(result);
        }
    }).update({
        id: Id,
        secret: Secret,
    });
};

/*-------------funkcyjki wyniczki itp------------*/

var horseScored = function(scoredHorseId){
    scores.find({horseId: scoredHorseId}, function(err, scored) {
        var scoredList = [];
        scored.forEach(function(score) {
            scoredList.push(score);
        });
        console.log("długość wyniku"+scoredList.length);
        io.sockets.emit('newScore',scoredList,scoredHorseId);
    });
};

//zwraca tablicę z idekami sędziow
var randomizeArbiters = function(){
  console.log("losujemy sędziow");
  arbiters.count({}, function(err, c) {
    randomizedArbiters = [1,2,3,4,5];
    var rzecz = 0;
    /*while(randomizedArbiters.length < 5){
      rzecz = Math.floor((Math.random() * c) + 1);
      if(randomizedArbiters.indexOf(rzecz) >= 0 && randomizedArbiters.indexOf(rzecz) < randomizedArbiters.length){
        randomizedArbiters.push(rzecz);
      }
    }*/
  });
  console.log(randomizedArbiters);
  io.sockets.emit('horseToScored', randomizedArbiters , actualHorse);
};





/*-------------------------------------------------------------------------------------------------------------------*/
/*---------------------------sokety i inne bajery-------------------------*/
io.sockets.on("connection", function (socket) {
    socket.on("message", function (data) {
        io.sockets.emit("aqq", data);
    });
    socket.on("error", function (err) {
        console.dir(err);
    });
    /*-----------Sokety na dodawanie-----------*/
    socket.on("addHorse", function (name){
        horses.count({}, function(err, c) {
            addHorse(c+1,name);
        });
    });
    socket.on("addArbiter", function (secret){
        arbiters.count({}, function(err, c) {
            addArbiter(c+1,secret);
        });
    });
    socket.on("addScore", function (horseIdInput,arbiterIdInput,T,G,K,N,R){
        //Done? TODO: sprawdzić czy arbiter już nie dodał wyniku jeśli tak to updejtować go
        //Done? TODO: sprawdzić czy sędziowie wszyscy sedziowie juz ocenili konia jesli tak to:
          //kon ++
          //losujemy nowych sędziow
          //wywolanie sedziow do oceny
          //wtedy i tylko wtedy wywolywac horseScored

        scores.findOneAndUpdate({horseId: horseIdInput, arbiterId: arbiterIdInput},
                {$set: {t: T, g: G, k: K, n: N, r: R} },
                {upsert: true},
                function(err)
                {
                    if (err) console.log(err);
        });

        setTimeout(function(){
          scores.find({horseId: horseIdInput}, function(err, wyniczek) {
            console.log("Dlugosc wyniczku "+wyniczek.length);
            if(wyniczek.length > 4){
              actualHorse++;
              horseScored(horseIdInput);
              randomizeArbiters();
            }
          });
        }, 200);
    });

    /*---------------czyszczenie DB--------------*/
    socket.on("clearDB", function (){
        horses.remove({}, function(err,removed) {});
        arbiters.remove({}, function(err,removed) {});
        scores.remove({}, function(err,removed) {});
    });

    socket.on("check", function(secretInput){
      //TODO: można by jebnac odpytanie sedziow aby sprawdzic czy lista zalogowanych jest aktualna
      //Potencjalne ryzyko - ansynchronicznosc
      console.log("Sekret do sprawdzenia" + secretInput);
      if(loggedInArbiters.indexOf(secretInput) >= 0 && loggedInArbiters.indexOf(secretInput) < loggedInArbiters.length){
        socket.emit('validSecret', false , 0 , "jesteś już zalogowany");
      } else {
        arbiters.find({secret: secretInput}, function(err, wyniczek) {
          var sedziowie = [];
          if (typeof wyniczek !== 'undefined'){
            wyniczek.forEach(function(score) {
                sedziowie.push(score);
            });
          }
          if (sedziowie.length < 1){
            socket.emit('validSecret', false , 0 , "niepoprawny sekret");
          } else{
            loggedInArbiters.push(secretInput);
            socket.emit('validSecret', true , sedziowie[0].id , "jest git");
          }
        });
      }
    });
    socket.on("disconectArbiter", function(secretInput){
      var i = loggedInArbiters.indexOf(secretInput);
      delete loggedInArbiters[i];
    });

    socket.on("getHorses", function (){
        horses.find({}, function(err, koniki) {
            var userMap = [];
            koniki.forEach(function(horse) {
                userMap.push(horse);
            });

            socket.emit('printHorses',userMap);
            horses.find({}, function(err, koniki){
                koniki.forEach(function(horse) {
                    scores.find({horseId: horse.id}, function(err, scored) {
                        var scoredList = [];
                        scored.forEach(function(score) {
                            scoredList.push(score);
                        });
                        io.sockets.emit('addOldScores',scoredList,horse.id);
                    });
                });
            });
        });
        console.log("wysłano konie");
    });
    //Mechanika obsługi zawodow
    socket.on("beginCompetition", function (){
      //TODO: dorobic mechanike zaczynania zawodow
      horses.count({}, function(err, numberOfHorses) {
        arbiters.count({}, function(err, numberOfArbiters) {
          if (numberOfHorses > 4 && numberOfArbiters > 4){
            actualHorse = 1;
            randomizeArbiters();
          } else {
            console.log("za mało koni albo sędziow");
          }
        });
      });
    });
    //Done? TODO: jakiś soket ktory przyjmuje z konsoli potrzebe monitu o czasie i przesyla taki monit do sędziow
    socket.on("hurryUp", function (){
      socket.emit('displayMonit');
    });
});

/*-------------------------------------------------------------------------------------------------------------------*/
httpServer.listen(port, function () {
    console.log('Serwer HTTP działa na porcie ' + port);
});
/*-------------------------------------------------------------------------------------------------------------------*/
