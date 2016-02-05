/* jshint browser: true, globalstrict: true, devel: true */
/* global io: false, $: false */
"use strict";

// Inicjalizacja
$(function(){
    var status = $("#status");
    var open = $("#open");
    var close = $("#close");
    var sendHorse = $("#sendHorse");
    var horseName = $("#horseName");
    var message = $("#message");
    var nick = $('#nick');
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
    /*--------------Inicjalizacja htmla------------------*/
    status.html = "Brak połącznia";
    close.prop('disabled', true);
    sendHorse.prop('disabled', true);
    $('#clean').prop('disabled', true);
    $('#sendScore').prop('disabled', true);
    $('#sendSecret').prop('disabled', true);
    /*-------------------------------------------------------------------------------------------------------------------*/
    // Po kliknięciu guzika „Połącz” tworzymy nowe połączenie WS
    open.click(function (event) {
        /*----------Connect&Disconetct-----------*/
        open.prop('disabled', true);
        if (!socket || !socket.connected) {
            socket = io({forceNew: true});
        }
        socket.on('connect', function () {
            open.prop('disabled', false);
            $('#sendSecret').prop('disabled', false);
            sendHorse.prop('disabled', false);
            $('#clean').prop('disabled', false);
            $('#sendScore').prop('disabled', false);
            open.prop('disabled', true);
            close.prop('disabled', false);
            status.attr('src',"img/bullet_green.png");
            message.html("Połączono z serwerem.");
            console.log('Nawiązano połączenie przez Socket.io');
        });
        socket.on('disconnect', function () {
            $('#sendSecret').prop('disabled', true);
            $('#clean').prop('disabled', true);
            sendHorse.prop('disabled', true);
            $('#sendScore').prop('disabled', true);
            open.prop('disabled', false);
            status.attr('src', "img/bullet_red.png");
            console.log('Połączenie przez Socket.io zostało zakończone');
        });
        /*-------------------------------------------------------------------------------------------------------------------*/

        socket.on("error", function (err) {
            message.html("Błąd połączenia z serwerem: '" + JSON.stringify(err) + "'");
        });
    });

    // Zamknij połączenie po kliknięciu guzika „Rozłącz”
    close.click(function (event) {
        $('#sendSecret').prop('disabled', true);
        $('#clean').prop('disabled', true);
        $('#sendScore').prop('disabled', true);
        close.prop('disabled', true);
        open.prop('disabled', false);
        message.html("Disconnected");
        socket.io.disconnect();
        console.dir(socket);
    });

    // Wyślij komunikat do serwera po naciśnięciu guzika „Wyślij”
    sendHorse.click(function (event) {
        socket.emit('addHorse',horseName.val());
        horseName.val("");
    });

    $('#sendSecret').click(function (event) {
        socket.emit('addArbiter',$('#secretText').val());
        $('#secretText').val("");
    });

    $('#clean').click(function (event) {
        socket.emit('clearDB');
        message.html("wyczyszczono");
    });

    $('#sendScore').click(function (event){
        socket.emit('addScore',$('#horseId').val(),$('#arbiterId').val(),$('#TInput').val(),$('#GInput').val(),$('#KInput').val(),$('#NInput').val(),$('#RInput').val());
        $('#horseId').val("");
        $('#arbiterId').val("");
        $('#TInput').val(10);
        $('#GInput').val(10);
        $('#KInput').val(10);
        $('#NInput').val(10);
        $('#RInput').val(10);
        $('#TSpan').html(10);
        $('#GSpan').html(10);
        $('#KSpan').html(10);
        $('#NSpan').html(10);
        $('#RSpan').html(10);
    });
});
