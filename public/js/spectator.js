/* jshint browser: true, globalstrict: true, devel: true */
/* global io: false, $: false */
"use strict";

// Inicjalizacja
$(function(){
    var status = $("#status");
    var open = $("#open");
    var close = $("#close");
    var message = $("#message");
    var table = document.getElementById("resultsTable");
    var socket;
    var horsesList = [];

    Array.prototype.getIndexByProperty = function (name, value) {
      for (var i = 0; i < this.length; i++) {
          if (this[i][name] == value) {
              return i;
          }
      }
      return -1;
    };

    function orderByProperty(prop) {
      var args = Array.prototype.slice.call(arguments, 1);
      return function (a, b) {
        var equality = a[prop] - b[prop];
        if (equality === 0 && arguments.length > 1) {
          return orderByProperty.apply(null, args)(a, b);
        }
        return equality;
      };
    }

    var printNewScore = function(scoredList,scoredHorseId){
        $('.scoredTable').empty();
        var SA = 0,NA = 0,St = 0,Nt = 0,Sr = 0,Nr = 0;
        var content = "";
        $(".scoredTable").append(
            "<h1>Ostatnio oceniony koń</h1>"+
            "<h2>" +
            horsesList[horsesList.getIndexByProperty("id",scoredHorseId)].name+
            "</h2>"+
            "<table class='scoredSection' border=\"2\"><tr>" +
            "<td>sędzia</td>" +
            "<td>T</td>" +
            "<td>G</td>" +
            "<td>K</td>" +
            "<td>N</td>" +
            "<td>R</td>" +
            "</table>");
        for(var i = 0; i < scoredList.length; i++) {
            content +=  "<tr><td>"+scoredList[i].arbiterId+"</td>"+
                "<td>"+scoredList[i].t+"</td>" +
                "<td>"+scoredList[i].g+"</td>" +
                "<td>"+scoredList[i].k+"</td>" +
                "<td>"+scoredList[i].n+"</td>" +
                "<td>"+scoredList[i].r+"</td>" +
                "</tr>";
            SA += Number(scoredList[i].t) + Number(scoredList[i].g) + Number(scoredList[i].k) + Number(scoredList[i].n) + Number(scoredList[i].r);
            NA += 5;
            St += Number(scoredList[i].t);
            Nt += 1;
            Sr += Number(scoredList[i].r);
            Nr += 1;
        }
        SA = SA/NA;
        St = St/Nt;
        Sr = Sr/Nr;
        horsesList[horsesList.getIndexByProperty("id",scoredHorseId)].SA = SA;
        horsesList[horsesList.getIndexByProperty("id",scoredHorseId)].St = St;
        horsesList[horsesList.getIndexByProperty("id",scoredHorseId)].Sr = Sr;
        //print();
        var licznik = 0;
        $("#resultsTable tr").each(function() {
          if(licznik !== 0) {
              var p = $(table.rows[licznik].cells[2]).text();
              if (SA > p) {
                  return;
              } else if (SA == p) {
                  //console.log("rowne");
                  var t = $(table.rows[licznik].cells[3]).text();
                  if(St > t) {
                      return;
                  } else if(St == t) {
                      var r = $(table.rows[licznik].cells[3]).text();
                      if(Sr > r) {
                          return;
                      } else if(Sr == r) {
                          return;
                          }
                      }
                  }
              }
          licznik++;
      });

      var row = table.insertRow(licznik);
      var c0 = row.insertCell(0);
      var c1 = row.insertCell(1);
      var c2 = row.insertCell(2);
      var c3 = row.insertCell(3);
      var c4 = row.insertCell(4);
      c0.innerHTML = scoredHorseId;
      c1.innerHTML = horsesList[horsesList.getIndexByProperty("id",scoredHorseId)].name;
      c2.innerHTML = SA.toFixed(2);
      c3.innerHTML = St.toFixed(2);
      c4.innerHTML = Sr.toFixed(2);
        $(".scoredSection").append(content + "<br><b>SA: </b>"+SA+"<b>St: </b>"+St+"<b>Sr: </b>"+Sr);
    };

    var addScore = function(scoredList,scoredHorseId){
      console.log("jestem w addScore");
        var SA = 0,NA = 0,St = 0,Nt = 0,Sr = 0,Nr = 0;
        for(var i = 0; i < scoredList.length; i++) {
            SA += Number(scoredList[i].t) + Number(scoredList[i].g) + Number(scoredList[i].k) + Number(scoredList[i].n) + Number(scoredList[i].r);
            NA += 5;
            St += Number(scoredList[i].t);
            Nt += 1;
            Sr += Number(scoredList[i].r);
            Nr += 1;
        }
        if(SA !== 0 && NA !== 0 && St !== 0 && Nt !== 0 && Sr !== 0 && Nr !== 0) {
            SA = SA / NA;
            St = St / Nt;
            Sr = Sr / Nr;
            horsesList[horsesList.getIndexByProperty("id",scoredHorseId)].SA = SA;
            horsesList[horsesList.getIndexByProperty("id",scoredHorseId)].St = St;
            horsesList[horsesList.getIndexByProperty("id",scoredHorseId)].Sr = Sr;
        }
        //print();
    };

    status.html = "Brak połącznia";
    close.prop('disabled', true);
    /*-------------------------------------------------------------------------------------------------------------------*/
    // Po kliknięciu guzika „Połącz” tworzymy nowe połączenie WS
    open.click(function (event) {
        /*----------Connect&Disconetct-----------*/
        open.prop('disabled', true);
        if (!socket || !socket.connected) {
            socket = io({forceNew: true});
        }
        socket.on('connect', function () {
            open.prop('disabled', true);
            close.prop('disabled', false);
            status.attr('src',"img/bullet_green.png");
            message.html("Połączono z serwerem.");
            console.log('Nawiązano połączenie przez Socket.io');
            socket.emit('getHorses');

        });
        socket.on('disconnect', function () {
            open.prop('disabled', false);
            status.attr('src', "img/bullet_red.png");
            console.log('Połączenie przez Socket.io zostało zakończone');
        });
        /*-------------------------------------------------------------------------------------------------------------------*/

        socket.on("error", function (err) {
            message.html("Błąd połączenia z serwerem: '" + JSON.stringify(err) + "'");
        });
        socket.on("aqq", function (data) {
            message.append("<p>" + data +'</p>');
        });
        socket.on("kon", function (kon) {
            message.append("<p>" + kon +'</p>');
        });
        socket.on("addHorses", function (horses){
            horsesList = horses;
        });
        socket.on("newScore", function (score,scoredHorseId){
            console.log("długość wyniku" + score.length);
            printNewScore(score,scoredHorseId);
        });
        socket.on("addOldScores", function (scores){
          scores.forEach(function(jeden){
            addScore(jeden.score,jeden.scoredHorseId);
            console.log("jeden.scoredHorseId"+jeden.scoredHorseId);
          });
          print();
        });
        //TODO: jakiś socket ktory wyświetlił by monit o zokończonych zawodach czy coś
    });

    // Zamknij połączenie po kliknięciu guzika „Rozłącz”
    close.click(function (event) {
        close.prop('disabled', true);
        open.prop('disabled', false);
        message.html("Disconnected");
        socket.io.disconnect();
        console.dir(socket);
    });
});
