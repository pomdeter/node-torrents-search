var TorrentsSearch = require('..');

// Custom logger
var myLogger = {
	info: function(msg) {
		console.log(msg);
	},

	error: function(msg) {
		console.error(msg);
	}
};

var torrents = new TorrentsSearch({
	logger: myLogger, // Optional
	timeout: 100000 // Optional
});

torrents.loadTrackers(function(err) {
	if(err) { console.log(err); return; }

	// Display all loaded trackers
	console.log('Loaded trackers :', torrents.getTrackers());

	// Enable a tracker
	torrents.enableTracker('t411');
	torrents.setCredentials('t411', 'USERNAME', 'PASSWORD');

	// Enable a tracker
	torrents.enableTracker('FrenchTorrentDB');
	torrents.setCredentials('FrenchTorrentDB', 'USERNAME', 'PASSWORD');

	// Enable a tracker
	torrents.enableTracker('Smartorrent');
	torrents.setCredentials('Smartorrent', 'USERNAME', 'PASSWORD');

	// Search torrents on all enabled trackers
	torrents.search('spiderman', {type: 'movie', quality: 'dvdrip'}, function(err, torrentsFound) {
		if(err) { console.error(err); return; }

		console.log(torrentsFound.length +' torrent(s) found.');

		console.log('Downloading first torrent :');
		torrents.download(torrentsFound[0], function(err, torrentFileBuffer) {
			if(err) { console.error(err); return; }

			console.log(torrentFileBuffer);
		});
	});
});