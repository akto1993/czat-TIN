/* jshint browser: true, globalstrict: true, devel: true */
/* global io: false, $: false */
"use strict";

// Inicjalizacja
$(function(){
    var status = $("#status");
    var open = $("#open");
    var close = $("#close");
    var message = $("#message");
    var mySecret = $('#secret');
    var validSecret = false;
    var horseToScored = 10;
    var socket;

    /*----------oninputy dla suwaczków-----------*/
    $("#TInput").bind("input change", function() {
        var T = $("#TInput").val().toString();
        $("#TSpan").html(T);
    });

    $("#GInput").bind("input change", function() {
        var T = $("#GInput").val().toString();
        $("#GSpan").html(T);
    });

    $("#KInput").bind("input change", function() {
        var T = $("#KInput").val().toString();
        $("#KSpan").html(T);
    });

    $("#NInput").bind("input change", function() {
        var T = $("#NInput").val().toString();
        $("#NSpan").html(T);
    });

    $("#RInput").bind("input change", function() {
        var T = $("#RInput").val().toString();
        $("#RSpan").html(T);
    });

    status.html = "Brak połącznia";
    close.prop('disabled', true);
    $('#sendScore').prop('disabled', true);
    /*-------------------------------------------------------------------------------------------------------------------*/
    // Po kliknięciu guzika „Połącz” tworzymy nowe połączenie WS
    open.click(function (event) {
        /*----------Connect&Disconetct-----------*/
        open.prop('disabled', true);
        if (!socket || !socket.connected) {
            socket = io({forceNew: true});
        }
        socket.on('connect', function () {
          socket.emit("check", mySecret.val());
          setTimeout(function(){
          if (validSecret){
              open.prop('disabled', true);
              close.prop('disabled', false);
              mySecret.prop('disabled', true);
              $('#sendScore').prop('disabled', false);
              status.attr('src',"img/bullet_green.png");
              message.html("Połączono z serwerem.");
              console.log('Nawiązano połączenie przez Socket.io');
          }else {
            //message.html("Błąd połączenia z serwerem: coś nie tak");
            socket.io.disconnect();
            open.prop('disabled', false);
          }
        }, 2000);
        });
        socket.on('disconnect', function () {
            socket.emit('disconectArbiter',mySecret.val());
            $('#sendScore').prop('disabled', true);
            open.prop('disabled', false);
            close.prop('disabled', true);
            mySecret.prop('disabled', false);
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
        socket.on("validSecret", function (valid,error){
          if (valid){
            validSecret = true;
          }else{
            validSecret = false;
            message.html("Błąd połączenia z serwerem: '"+ error +"'");
          }
        });
    });

    // Zamknij połączenie po kliknięciu guzika „Rozłącz”
    close.click(function (event) {
        socket.emit('disconectArbiter',mySecret.val());
        close.prop('disabled', true);
        open.prop('disabled', false);
        $('#sendScore').prop('disabled', true);
        message.html("Disconnected");
        socket.io.disconnect();
        console.dir(socket);
    });

    // Wyślij komunikat do serwera po naciśnięciu guzika „Wyślij”
    $('#sendScore').click(function (event){
            socket.emit('addScore', $('#horseId').val(), 1, $('#TInput').val(), $('#GInput').val(), $('#KInput').val(), $('#NInput').val(), $('#RInput').val());
            $('#TInput').val(10);
            $('#GInput').val(10);
            $('#KInput').val(10);
            $('#NInput').val(10);
            $('#RInput').val(10);
            $('#horseId').val("");
            $('#TSpan').html(10);
            $('#GSpan').html(10);
            $('#KSpan').html(10);
            $('#NSpan').html(10);
            $('#RSpan').html(10);
    });
});
