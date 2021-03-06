# node-torrents-search

[![NPM](https://nodei.co/npm/torrents-search.png)](https://nodei.co/npm/torrents-search/) [![David DM](https://david-dm.org/leeroybrun/node-torrents-search.png)](https://david-dm.org/leeroybrun/node-torrents-search "David DM")

Node module used to search torrents on private trackers websites.

## Currently supported trackers

- t411
- Smartorrent
- FrenchTorrentDB

You can easily add new trackers by creating a file in `lib/trackers`.

## Install

```shell
npm install torrents-search
```

## Usage

```javascript
var TorrentsSearch = require('torrents-search');

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
```

## Options

* `logger` This let you define a custom logger. It should have two methods : `info` and `error`. If you just want to log errors, just create an empty `info` method. Default is an empty logger that will do nothing.
* `timeout` Define the desired timeout (milliseconds) for requests sent to trackers. Default is 10000 (10s). This is a way to protect us from slow trackers who can block others.

## API

Here is the list of all available methods of the module.

* `loadTrackers(callback)`

    Load all the trackers in the `lib/trackers` folder.
    You need to call this before calling any other method.
    All trackers loaded are disabled by default.

    The callback function takes only an `error` argument.

* `getTrackers()`

    Return an array with the names of all loaded trackers.

* `enableTracker(trackerName)`

    Enable the specified tracker.

* `disableTracker(trackerName)`

    Disable the specified tracker.

* `setCredentials(trackerName, username, password)`

    Set the username/password used for the tracker.

* `login(callback)`

    Login on all enabled trackers.
    This is automatically done when using a method requiring login (search, download).

    The callback only takes an `error` argument.

* `search(query, options, callback)`

    Search the specified `query` on all enabled trackers.

    Options is an object with the following values :

    * `type` : `movie` or `tvshow` (only movie is supported yet)
    * `quality` : `dvdrip`, `bluray`, `screener` (WIP)

    The callback takes 2 arguments :

    * `error`
    * `torrentsFound` An array with all the torrents found on enabled trackers.

* `download(torrent, callback)`

    Download the specified `torrent`.

    The callback takes 2 arguments :

    * `error`
    * `torrentFileBuff` A buffer of the downloaded torrent file.

## Warning

This module is currently in active development, the API can change a lot.
Please set the version on your package.json dependencies, this way you will not be affected by any `npm update`.

## TODO

* Add support for generic torrent search (no categories)
* Add tests
* Add TV Shows support
* Add more quality options
* Custom errors
* Add more trackers

Licence
======================
(The MIT License)

Copyright (C) 2013 Leeroy Brun, www.leeroy.me

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/leeroybrun/node-torrents-search/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
