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
    var horseToScored = 0;
    var myArbiterId = 0;
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
    $("#TInput").prop('disabled', true);
    $("#GInput").prop('disabled', true);
    $("#KInput").prop('disabled', true);
    $("#NInput").prop('disabled', true);
    $("#RInput").prop('disabled', true);
    $('#divek').hide();
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
          if (!validSecret){
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
            myArbiterId = 0;
            $('#myId').html("");
        });
        /*-------------------------------------------------------------------------------------------------------------------*/

        socket.on("error", function (err) {
            message.html("Błąd połączenia z serwerem: '" + JSON.stringify(err) + "'");
        });
        //Done?   TODO:czy ocenia jeśli tak to jakiego konia mam oceniać
        //przyjmuje tablice idkow sędziow oraz ideka konia
        socket.on("horseToScored", function (arbiterIdek,horseId){
          //TODO: jakieś wyświetlanie ktorego konia teraz oczeniaja sedziowie
          console.log("arbiter Id " + arbiterIdek + " horseId " + horseId + " numerk " + myArbiterId);
          if(arbiterIdek.indexOf(myArbiterId) >= 0 && arbiterIdek.indexOf(myArbiterId) < arbiterIdek.length){
            //ten arbiter został wylosowany
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
            $('#monit').html("");
            $("#TInput").prop('disabled', false);
            $("#GInput").prop('disabled', false);
            $("#KInput").prop('disabled', false);
            $("#NInput").prop('disabled', false);
            $("#RInput").prop('disabled', false);
            $('#sendScore').prop('disabled', false);
            $('#divek').show();
            horseToScored = horseId;
            if (horseId === 0){
              $('#actualHorseId').html("Oczekuje na rozpoczęcie zawodów");
            }else{
              $('#actualHorseId').html(horseId);
            }
          }else{
            //ten arbiter oczekuje na kolejne losowanie
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
            $('#monit').html("");
            $("#TInput").prop('disabled', true);
            $("#GInput").prop('disabled', true);
            $("#KInput").prop('disabled', true);
            $("#NInput").prop('disabled', true);
            $("#RInput").prop('disabled', true);
            $('#sendScore').prop('disabled', true);
            $('#divek').hide();
            if (horseId === 0){
              $('#actualHorseId').html("Oczekuje na rozpoczęcie zawodów");
            }else{
              $('#actualHorseId').html(horseId + "<br><font color=\"red\">Nie zostałeś wybrany do oceniania tego konia</font>");
            }
          }
        });
        //Done?  TODO:guziczek do pośpieszania sędziow
        socket.on("displayMonit", function (){
            $('#monit').html("Pospiesz się!");
        });
        //otrzymanie wyniku sprawdzania poprawności sekretu
        socket.on("validSecret", function (valid,id,error){
          if (valid){
            validSecret = true;
            myArbiterId = id;
            $('#myId').html(id);
            open.prop('disabled', true);
            close.prop('disabled', false);
            mySecret.prop('disabled', true);
            status.attr('src',"img/bullet_green.png");
            //message.html("Połączono z serwerem.");
            //TODO: Zapytaj serwer czy co jest teraz oceniane
          }else{
            validSecret = false;
            message.html("Błąd połączenia z serwerem: '"+ error +"'");
          }
        });
        //TODO: może jakis connection tester aby wyjebać z listy zalogowanych rozlaczonych sedziow
    });

    // Zamknij połączenie po kliknięciu guzika „Rozłącz”
    close.click(function (event) {
        socket.emit('disconectArbiter',mySecret.val());
        close.prop('disabled', true);
        open.prop('disabled', false);
        message.html("Disconnected");
        socket.io.disconnect();
        console.dir(socket);
        myArbiterId = 0;
        $('#myId').html("");
    });

    // Wyślij komunikat do serwera po naciśnięciu guzika „Wyślij”
    $('#sendScore').click(function (event){
            socket.emit('addScore', horseToScored, myArbiterId, $('#TInput').val(), $('#GInput').val(), $('#KInput').val(), $('#NInput').val(), $('#RInput').val());
            $('#monit').html("");
    });
    $(window).on('unload',function(){
      socket.emit('disconectArbiter',mySecret.val());
    });
});
