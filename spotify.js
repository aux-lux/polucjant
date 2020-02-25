const SpotifyWebApi = require('spotify-web-api-node');
const spotifyConfig = require('./spotify-config');
let spotifyApi;
const scopes = [
	'user-modify-playback-state',
	'user-read-playback-state',
	'user-read-currently-playing',
	'playlist-modify-public',
	'playlist-modify-private'
];
const state = 'my-player';
let authorizeURL;

let code;
let codeExpires;
let socket;

let me;
let volume;
let device;
let token;

const authenticate = () => {
	socket.emit('spotify', { redirect: authorizeURL });
}

function getMe () {
	spotifyApi.getMe().then(function(data) {
		me = data.body;
	}, errorHandler)
}

function getVolume () {
	spotifyApi.getMyCurrentPlaybackState().then(function(data) {
		volume = data.body.device.volume_percent;
		device = data.body.device.id;
	}, errorHandler)
}

function voiceSetVolume (value) {
	const volumeDictionary = {
		max: 100,
		mutuj: 0,
		cisza: 0,
		'połowa': 50,
	};

	if (volumeDictionary[value] !== undefined) {
		setVolume(volumeDictionary[value]);
	} else {
		setVolume(value * 10);
	}
}

function volumeUp () {
	setVolume(Math.round(volume/10)*10 + 10);
}

function volumeDown () {
	setVolume(Math.round(volume/10)*10 - 10);
}

function errorHandler (error) {
	if (error.statusCode === 401) {
		//refreshSpotifyToken();
		authenticate();
	}
}

function setVolume (num) {
	console.log('volume try:', num);
	if (typeof num === 'number' && num % 10 === 0) {
		var newVolume = Math.min(100, Math.max(0, num));
		console.log('setting volume:', newVolume);
		console.log('device:', device);
		spotifyApi.setVolume(device, newVolume).then(function(data) {
			console.log('volume set to: ', newVolume);
			volume = newVolume;
		}, errorHandler);
	}
}

function refreshToken (refreshToken) {
	console.log('Refresh Token', refreshToken);
	refreshSpotifyToken();
	code = '';
}

function setSpotifyCode (_code) {
	code = _code;
	console.log('spotifyApi: ', spotifyApi, spotifyApi && Object.keys(spotifyApi));
	spotifyApi.authorizationCodeGrant(code).then(function(data) {
		// console.log('The token expires in ' + data.body['expires_in']);
		// console.log('The access token is ' + data.body['access_token']);
		// console.log('The refresh token is ' + data.body['refresh_token']);
		setTimeout(authenticate, data.body['expires_in'] * 1000);
		token = data.body['access_token'];
		// Set the access token on the API object to use it in later calls
		spotifyApi.setAccessToken(data.body['access_token']);
		spotifyApi.setRefreshToken(data.body['refresh_token']);
		getMe();
		getVolume();
	}, function(err) {
		console.log('Something went wrong!', err);
	});
}

function refreshSpotifyToken () {
	spotifyApi.refreshAccessToken().then(function(data) {
		// console.log('Data ' + data.body);
		// console.log('The token expires in ' + data.body['expires_in']);
		// console.log('The access token is ' + data.body['access_token']);
		// console.log('The refresh token is ' + data.body['refresh_token']);
		spotifyApi.setAccessToken(data.body['access_token']);
		//spotifyApi.setRefreshToken(data.body['refresh_token']);
		/*
		token = data.body['access_token'];
		// Set the access token on the API object to use it in later calls
		getMe();
		getVolume();
		*/
	}, function(err) {
		console.log('Something went wrong!', err);
	});
}


function spotifyPause () {
	console.log('Pause song');
	spotifyApi.pause().then(function(data) {
		console.log('Paused');
	}, errorHandler)
}

function spotifyPlay () {
	console.log('Play song');
	spotifyApi.play().then(function(data) {
		console.log('Playing');
	}, errorHandler)
}

function spotifyNext () {
	console.log('Play next song');
	spotifyApi.skipToNext().then(function(data) {
		console.log('Playing');
	}, errorHandler)
}

function spotifyPrev () {
	console.log('Play previous song');
	spotifyApi.skipToPrevious().then(function(data) {
		console.log('Playing');
	}, errorHandler)
}

const onSocketData = (data) => {
	if (data) {
		if (data.action) {
			console.log('Action: ', data.action);
			if (typeof actions[data.action] === 'function') {
				actions[data.action](data.value);
			} else {
				console.log(data.action, 'Action not found');
				console.log(actions[data.action]);
			}
		}
	} else {
		if (!code) {
			//socket.emit('spotify', { redirect: authorizeURL });
			authenticate();
		} else {
			socket.emit('spotify', { code });
		}
	}
}



const check = () => {
	console.log('Whats the song');
	spotifyApi.getMyCurrentPlayingTrack().then(function(data) {
		// var item = data.body.item;
		const progress = data.body.progress_ms;
		const id = data.body.item.id;

		spotifyApi.getAudioAnalysisForTrack(id).then((a, b) => {
			const beats = a.body.beats.map((beat) => beat.start);
			socket.emit('spotify', { beats, progress});
			// console.log('beats: ', beats);
			// console.log('bars0:', a.bars[0]);
		});

		console.log(id, progress);
		/*
		console.log(data);
		var response = {
			artists: item.artists.map((item) => {
				return item.name;
			}),
			title: item.name,
		};

		socket.emit('spotify', { playing: response });
		//https://api.spotify.com/v1/audio-features/
		*/
	}, function(err) {
		console.log('Something went wrong!', err);
	})
}

const like = () => {
	console.log('Add to like');
	spotifyApi.getMyCurrentPlayingTrack().then(function(data) {
		var item = data.body.item;
		spotifyApi.addTracksToPlaylist(me.id, '4DKFP4TWxeLym8L4hvFWdB', [item.uri]).then(function(data) {
			console.log('Dodano do playlisty: ', data);
			socket.emit('spotify', { like: true })
		}, function(err) {
			console.log('Something went wrong!', err);
		});

	}, errorHandler)
}

const actions = {
	auth: authenticate,
	play: spotifyPlay,
	pause: spotifyPause,
	next: spotifyNext,
	prev: spotifyPrev,
	volUp: volumeUp,
	volDown: volumeDown,
	volume: voiceSetVolume,
	like,
	check,
};


module.exports = {
	actions,
	setSocket: (_socket, baseUrl) => {
		socket = _socket;
		spotifyConfig.redirectUri = baseUrl;
		spotifyApi = new SpotifyWebApi(spotifyConfig);
		authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
	},
	onSocketData,
	setSpotifyCode,
};
