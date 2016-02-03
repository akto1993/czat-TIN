/* jshint node: true */
var express = require('express');
var app = express();
var httpServer = require("http").Server(app);
var io = require("socket.io")(httpServer);
var mongoose = require('mongoose');

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
        io.sockets.emit('newScore',scoredList,scoredHorseId);
    });
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
    socket.on("addScore", function (horseId,arbiterId,t,g,k,n,r){
        scores.count({}, function(err, c) {
            addScore(c+1,horseId,arbiterId,t,g,k,n,r);

        });
        console.log("Przesłano konia " + horseId );
        horseScored(horseId);       //temporary!
    });

    /*---------------czyszczenie DB--------------*/
    socket.on("clearDB", function (){
        horses.remove({}, function(err,removed) {});
        arbiters.remove({}, function(err,removed) {});
        scores.remove({}, function(err,removed) {});
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


});

/*-------------------------------------------------------------------------------------------------------------------*/
httpServer.listen(port, function () {
    console.log('Serwer HTTP działa na porcie ' + port);
});
