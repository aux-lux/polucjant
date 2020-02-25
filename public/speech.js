var girl = setupSpeechSynthesis();
var json = false;
var voices = [];
var hotWords = ['jason', 'jasonie'];

function loadVoices() {
	voices = speechSynthesis.getVoices();
}

function englishVoice () {
  return voices.filter((v) => {
    return v.name === 'Google UK English Male';
  }).pop();
}

function setupSpeechSynthesis () {
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
	return {
		say: function (txt) {
      console.log('saying');
			var msg = new SpeechSynthesisUtterance();
      //msg.lang = 'en-GB';
      msg.voice = englishVoice();
			msg.text = txt;
			speechSynthesis.speak(msg);
		},
    powiedz: function (txt) {
      var msg = new SpeechSynthesisUtterance();
      msg.lang = 'pl-PL';
      //msg.voice = englishVoice();
			msg.text = txt;
      //msg.pitch = 0.8;
      //msg.volume = 1;
			speechSynthesis.speak(msg);
    }
	}
}

function getHour () {
	var time = (new Date());
	girl.powiedz(time.getHours() + ':' + ('0' + time.getMinutes()).slice(-2));
	json = false;
}

function getTemperature () {
	slaves[1064080].loadValue('Weather').then(function(response){
		girl.powiedz((Math.round(response.data.temp * 10) / 10).toString().split('.').join(',') + '°C');
	});
	json = false;
}

function getHumidity () {
	slaves[1064080].loadValue('Weather').then(function(response){
		girl.powiedz(Math.round(response.data.humi) + '%');
	});
	json = false;
}
function getPressure () {
	slaves[1064080].loadValue('Weather').then(function(response){
		girl.powiedz(Math.round(response.data.pres) + 'hPa');
	});
	json = false;
}

function what () {
  if (!json) {
    const responses = ['Co?', 'A no?', 'Co tam?', 'Czego?', 'Co znowu?', 'Aha?'];
    var rand = Math.floor(Math.random() * responses.length);
    json = true;

    girl.powiedz(responses[rand]);
  }
}

function confirm () {
  const responses = ['Ok!', 'spoko', 'robi się', 'zrobione', 'spoczi', 'luzik'];
  var rand = Math.floor(Math.random() * responses.length);
  json = false;

  girl.powiedz(responses[rand]);
}

function noProblem () {
  const responses = ['Nie ma sprawy', 'Spoczko', 'Luzik', 'Robim co możem', 'Luz blues'];
  var rand = Math.floor(Math.random() * responses.length);

  girl.powiedz(responses[rand]);
}

function spotifyPause() {
  socket.emit('spotify', {action:'pause'});
  confirm();
}

function spotifyPlay() {
  socket.emit('spotify', {action:'play'});
  confirm();
}

function spotifyNext() {
  socket.emit('spotify', {action:'next'});
  confirm();
}

function spotifyPrev() {
  socket.emit('spotify', {action:'prev'});
  confirm();
}

function spotifyCheck() {
  //console.log('check song');
  socket.emit('spotify', {action:'check'});
  json = false;
  //confirm();
}

function zapowiedz (data) {
  if (data.artists.length === 1) {
    //girl.say(['Wykonawca', data.artists[0], ', utwór', data.title].join(' '));
    girl.say(['Author: ', data.artists[0], '. Title: ', data.title].join(' '));
  }
}

function addToFav () {
  socket.emit('spotify', {action:'like'});
}

function confirmLike () {
  girl.powiedz('Dodano do ulubionych');
}

function noHej () {
  girl.powiedz('no hej');
}

function volumeUp() {
  socket.emit('spotify', {action:'volUp'});
  confirm();
}

function volumeDown() {
  socket.emit('spotify', {action:'volDown'});
  confirm();
}
function setVolume(value) {
  socket.emit('spotify', {action: 'volume', value: value });
  confirm();
}

function que () {
  const responses = ['no co', 'o co Ci chodzi', 'czepiasz się', 'wyluzuj stary'];
  var rand = Math.floor(Math.random() * responses.length);

  girl.powiedz(responses[rand]);
}

var instant = {
  'no hej': noHej,
  'dzięki': noProblem,
  'boże': que,
  'jezu': que,
  'o matko': que,
};

var commands = {
	'która godzina': getHour,
  'stop': spotifyPause,
  'start': spotifyPlay,
  'graj': spotifyPlay,
  'dalej': spotifyNext,
  'następny': spotifyNext,
  'następna': spotifyNext,
  'wróć': spotifyPrev,
  'wstecz': spotifyPrev,
  'co to': spotifyCheck,
  'lubię': addToFav,
  'głośniej': volumeUp,
  'ciszej': volumeDown,
  'temperatura': getTemperature,
  'wilgotność': getHumidity,
  'ciśnienie': getPressure,
  'a nic': confirm,
  'nic': confirm,
  'już nic': confirm,
  'gówno': confirm,
  'zabłyśnij': getQuote,
  'powiedz coś mądrego': getQuote,
};

function getQuote() {
  socket.emit('quote');
}

socket.on('quote', function (quote) {
  girl.powiedz(quote);
  json = false;
  //console.log('got quote: ', quote);
});

var patterns = [
  {
    pattern: /ustaw wiatrak na ([0-9])/,
    action: ustawWiatrak,
  },
  {
    pattern: /smok ([0-9])/,
    action: ustawWiatrak,
  },
  {
    pattern: /smog ([0-9])/,
    action: ustawWiatrak,
  },
  {
    pattern: /poziom ([0-9])/,
    action: setVolume,
  },
];

function ustawWiatrak(value) {
  var valuesRange = [0,4];
  if (value >= valuesRange[0] && value <= valuesRange[1] && typeof setFans === 'function') {
    //console.log('ustawWiatrak: ', value);
    setFans(value);
  }
  confirm();
}

var debounce = (func, delay) => {
  var inDebounce
  return function() {
    var context = this
    var args = arguments
    clearTimeout(inDebounce)
    inDebounce = setTimeout(() => func.apply(context, args), delay)
  }
}

function setupSpeechRecognition () {
	if ('webkitSpeechRecognition' in window) {
    //alert('there is webkitSpeechRecognition');

		var button = document.querySelector('#start');
		button.onclick = startButton;

		var recognition = new webkitSpeechRecognition();
    //recognition.confidence = 0.5;
    //console.log('speechRecognitionAlternativeInstance.confidence: ', speechRecognitionAlternativeInstance.confidence);
		recognition.interimResults = true;
		recognition.continuous = true;
    //recognition.lang = 'es-ES';
		//recognition.interimResults = true;

		function startButton() {
      //button.disabled = true;
			recognition.start();
		}

		recognition.onstart = function() {
      button.className = 'active';
			console.log('start');
      //alert('started');
		}

    var delay = 200;
    var commandTimeout;

    function doCommand (fn) {
      if (typeof fn === 'function') {
        clearTimeout(commandTimeout);
        commandTimeout = setTimeout(fn, delay);
      }
    }

    var alreadyDone = false;
    var restart;
		recognition.onresult = function(event) {
			for (var i = event.resultIndex; i < event.results.length; ++i) {
        //console.log('Result: ', event.results[i]);
				if (event.results[i]) {
          var final = event.results[i].isFinal;

					var msg = event.results[i][0].transcript.trim().toLowerCase();
          if (hotWords.indexOf(msg) !== -1) {
            what();
            recognition.stop();
          } else if (typeof instant[msg] === 'function') {
            doCommand(instant[msg]);
            //instant[msg]();
            recognition.stop();
          } else if (typeof commands[msg] === 'function' && json) {
            doCommand(commands[msg]);
            //commands[msg]();
            recognition.stop();
          } else if (json) {
            patterns.forEach(function (p) {
              if (p.pattern.test(msg) && typeof p.action === 'function') {
                doCommand(function () {
                  p.action(msg.match(p.pattern)[1]);
                });
                //p.action(msg.match(p.pattern)[1]);
                recognition.stop();
              }
            });
          }

					console.log('Message: ', msg);
					//girl.say(msg)
				}
			}
		}
		recognition.onerror = function(event) {
			console.warn('error', event);
		}
		recognition.onend = function() {
			console.log('end');
      recognition.start();
		}

		//final_transcript = '';
		//recognition.lang = select_dialect.value;

		console.log('starting');
	} else {
    alert('no webkitSpeechRecognition');
  }
}


setupSpeechRecognition();
