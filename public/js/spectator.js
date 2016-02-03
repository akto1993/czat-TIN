/* jshint browser: true, globalstrict: true, devel: true */
/* global io: false, $: false */
"use strict";

// Inicjalizacja
$(function(){
    var status = $("#status");
    var open = $("#open");
    var close = $("#close");
    var message = $("#message");
    var socket;
    var horsesList = [];


    var isItNumber = function(lol){
        if(typeof lol != 'undefined')
            return lol
        else return "Brak"
    }

    var print = function(){
        $('.horsesSection').remove();
        var content = "";
        $(".horsesTable").append(
            "<table class='horsesSection'><tr>" +
            "<td>id</td>" +
            "<td>name</td>" +
            "<td>SA</td>" +
            "<td>St</td>" +
            "<td>Sr</td>" +
            "</table>");
        for(var i = 0; i < horsesList.length; i++) {
            content +=  "<tr><td>"+horsesList[i].id+"</td>"+
                        "<td>"+horsesList[i].name+"</td>" +
                        "<td>"+isItNumber(horsesList[i].SA)+"</td>" +
                        "<td>"+isItNumber(horsesList[i].St)+"</td>" +
                        "<td>"+isItNumber(horsesList[i].Sr)+"</td>" +
                        "</tr>";
        }
        $(".horsesSection").append(content);
    };

    var printNewScore = function(scoredList,scoredHorseId){
        $('.scoredTable').empty();
        var SA = 0,NA = 0,St = 0,Nt = 0,Sr = 0,Nr = 0;
        var content = "";
        $(".scoredTable").append(
            "<h1>Ostatnio oceniony koń</h1>"+
            "<h2>" +
            horsesList[scoredHorseId-1].name+
            "</h2>"+
            "<table class='scoredSection'><tr>" +
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
        horsesList[scoredHorseId-1].SA = SA;
        horsesList[scoredHorseId-1].St = St;
        horsesList[scoredHorseId-1].Sr = Sr;
        print();
        $(".scoredSection").append(content + "<br><b>SA: </b>"+SA+"<b>St: </b>"+St+"<b>Sr: </b>"+Sr);
    };

    var addScore = function(scoredList,scoredHorseId){
        var SA = 0,NA = 0,St = 0,Nt = 0,Sr = 0,Nr = 0;
        for(var i = 0; i < scoredList.length; i++) {
            SA += Number(scoredList[i].t) + Number(scoredList[i].g) + Number(scoredList[i].k) + Number(scoredList[i].n) + Number(scoredList[i].r);
            NA += 5;
            St += Number(scoredList[i].t);
            Nt += 1;
            Sr += Number(scoredList[i].r);
            Nr += 1;
        }
        if(SA != 0 && NA != 0 && St != 0 && Nt != 0 && Sr != 0 && Nr != 0) {
            SA = SA / NA;
            St = St / Nt;
            Sr = Sr / Nr;
            horsesList[scoredHorseId - 1].SA = SA;
            horsesList[scoredHorseId - 1].St = St;
            horsesList[scoredHorseId - 1].Sr = Sr;
            print();
        }
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
        socket.on("printHorses", function (horses){
            horsesList = horses;
            print();
        });
        socket.on("newScore", function (score,scoredHorseId){
            console.log("otrzymano wynik" + scoredHorseId);
            printNewScore(score,scoredHorseId);
        });
        socket.on("addOldScores", function (score,scoredHorseId){
            addScore(score,scoredHorseId);
        });
    });
    
    // Zamknij połączenie po kliknięciu guzika „Rozłącz”
    close.click(function (event) {
        close.prop('disabled', true);
        open.prop('disabled', false);
        message.html("Disconnected");
        socket.io.disconnect();
        console.dir(socket);
    });

    // Wyślij komunikat do serwera po naciśnięciu guzika „Wyślij”
});