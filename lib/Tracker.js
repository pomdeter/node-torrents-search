var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var utils = require('./utils');

// Tracker class

/*********************************************************
 * Constructor
 ********************************************************/
var Tracker = function(options) {
    options = options || {};

    this.options = {
        timeout: options.timeout || 10000
    };

    this.enabled = false;

    this._login = {
        status: false,
        lastLogin: 0,
        username: '',
        password: ''
    };

    this._cookies = request.jar();
};

/*********************************************************
 * Properties
 ********************************************************/
Tracker.prototype = {
    name: '',

    _urls: {
        'home':       '',
        'login':      '',
        'loginCheck': '',
        'search':     '',
        'download':   ''
    },

    _cats: {
        'movie': {
            'dvdrip': {},
            'bluray': {},
            'screener': {}
        },
        'tvshow': {
            'dvdrip': {},
            'bluray': {},
            'screener': {}
        }
    },

    /*********************************************************
     * Public methods
     ********************************************************/

    /**
     *  Set credentials for the tracker
     */
    setCredentials: function(username, password) {
        this._login.username = username;
        this._login.password = password;
    },

    /**
     *  Check if we are logged in on tracker
     *      - Last login < 5 mins ago -> we presume we are logged in
     *      - Last login > 5 mins ago -> we fetch the tracker's "loginCheck" url and checkLoginSuccess
     */
    isLogged: function(callback) {
        callback = callback || function(status) {};
        var that = this;
        
        // Check if already logged in less than 5 minutes ago
        if(this._login.status && (Date.now() - this._login.lastLogin) < 300000) {
            callback(true);
            return;
        } else {
            // If not logged in or more than 5 minutes ago, we presume that we are not logged anymore and we need to check again
            this._login.status = false;
        }
                    
        this._request({url: that._urls.loginCheck, method: 'GET'}, function(error, response, body) {    
            if(that._checkLoginSuccess(body)) {            
                that._login.status = true;
                that._login.lastLogin = Date.now();
                
                callback(true);
            } else {
                callback(false);
            }
        });
    },

    /**
     *  Check if we are logged in on the tracker, and if not -> do the login
     */
    login: function(callback) {
        callback = callback || function(status) {};
        var that = this;

        async.waterfall([
            // --------------------------------------------
            // Check if we are not already logged
            // --------------------------------------------
            function checkLoginStatus(cb) {
                that.isLogged(function(status) {
                    if(status === true) { 
                        cb(true); // This way we stop the waterfall, we are already logged in
                    } else {
                        cb(null);
                    }
                });
            },

            // --------------------------------------------
            // Get login data & construct request options
            // --------------------------------------------
            function getTrackerLoginData(cb) {
                that._getLoginData(function(data) {
                    var rOptions = {
                        url: that._urls.login,
                        method: data.method,
                        form: data.fields,
                        headers: data.headers
                    };

                    cb(null, rOptions);
                });
            },

            // --------------------------------------------
            // Send login form
            // --------------------------------------------
            function sendLoginForm(rOptions, cb) {
                that._request(rOptions, function(error, response, body) {
                    if(error) { 
                        cb('['+that.name+'] Login error : '+ error +'.');
                    } else if(response.statusCode !== 200) { 
                        cb('['+that.name+'] Login error : '+ response.statusCode +'.');
                    } else {
                        cb(null, body);
                    }
                });
            },

            // --------------------------------------------
            // Check if the login succeeded
            // --------------------------------------------
            function checkIfLoginSucceeded(body, cb) {
                if(that._checkLoginSuccess(body) === true) {
                    // Login successful
                    that._login.status = true;
                    that._login.lastLogin = Date.now();
                    cb(null);
                } else {
                    // Login failed
                    cb('['+that.name+'] Login failed.');
                }
            }
        ], function(err) {
            // If err is true, it's just that we were already logged in
            if(err === true) {
                callback(null);
            } else {
                callback(err);
            }
        });
    },

    /**
     *  Search for torrents on the tracker
     */
    search: function(text, options, callback) {
        if (typeof text === 'undefined') { callback('Please provide a text to search.', []); return; }
        options = options || {};
        options.quality = options.quality || 'dvdrip'; 
        options.type = options.type || 'movie';
        callback = callback || function(status) {};

        var that = this;

        async.waterfall([
            function doCheckLogin(cb) {
                that.login(function(error) {
                    if (error) {
                        cb("["+that.name+"] Can't search on tracker, login failed.", []);
                    } else {
                        cb(null);
                    }
                });
            },

            function getSearchOptions(cb) {
                that._getSearchData(text, options, function(data) {
                    if(that._cats[options.type][options.quality]) {
                        data.fields = utils.extend(data.fields, that._cats[options.type][options.quality]);
                    }

                    var rOptions = {
                        url: that._urls.search,
                        method: data.method, 
                        headers: data.headers,
                        params: data.fields
                    };

                    cb(null, rOptions);
                });
            },

            function makeSearchRequest(rOptions, cb) {
                // Send the search form
                that._request(rOptions, function(error, response, body) {
                    if(error) {
                        cb(error);
                    } else if(response.statusCode !== 200) {
                        cb('Error with search form : '+ response.statusCode);
                    } else {
                        cb(null, body);
                    }
                });
            },

            function parseResponse(body, cb) {                
                // Parse results
                that.parse(body, function(err, torrents) {
                    cb(err, torrents);
                });
            }
        ], function(err, torrents) {
            callback(err, torrents);
        });
    },

    /**
     *  Parse tracker's search page results
     */
    parse: function(body, callback) {
        var that = this;

        this._getParseData(function(parseData) {
            var $ = cheerio.load(body);
            var torrentsEl = $(parseData.item);

            // No torrents found
            if (torrentsEl.length === 0) {
                callback('No torrents found');

                return;
            }

            var torrents = [];
        
            async.each(torrentsEl, function(torrentEl, cb) {
                var $torrentEl = $(torrentEl);

                // Parse torrent infos
                var torrent = {
                    detailsUrl: $torrentEl.find(parseData.detailsLink).eq(0).attr('href').trim(),
                    title: $torrentEl.find(parseData.title).eq(0).text().trim(),
                    size: $torrentEl.find(parseData.size).eq(0).text().trim(),
                    seeders: parseInt($torrentEl.find(parseData.seeders).eq(0).text().trim()),
                    leechers: parseInt($torrentEl.find(parseData.leechers).eq(0).text().trim()),
                    tracker: that.name,
                    data: {}
                }
                
                // Parse custom fields
                for(var paramName in parseData.data) {
                    if(typeof parseData.data[paramName] == 'object') {
                        var regex = new RegExp(parseData.data[paramName].regex);
                        var regexMatches = regex.exec($.html($torrentEl.find(parseData.data[paramName].selector).eq(0)));
                        if(regexMatches != null && regexMatches.length > 1) {
                            torrent.data[paramName] = regexMatches[regexMatches.length - 1].trim();
                        }
                    } else {
                        torrent.data[paramName] = $torrentEl.find(parseData.data[paramName]).eq(0).text().trim();
                    }
                }
                
                torrents.push(torrent);

                cb(null);
            }, function(err) {
                callback(err, torrents);
            });
        });
    },

    /**
     *  Download a torrent on the specified tracker
     */
    download: function(torrent, callback) {
        var that = this;

        async.waterfall([
            function doCheckLogin(cb) {
                that.login(function(error) {
                    if (error) {
                        cb("["+that.name+"] Can't download torrent '"+torrent.name+"', login failed.", []);
                    } else {
                        cb(null);
                    }
                });
            },

            function getDownloadOptions(cb) {
                that._getDownloadData(torrent, function(data) {
                    var rOptions = {
                        url: that._urls.download,
                        method: data.method, 
                        headers: data.headers,
                        params: data.fields,
                        encoding: null
                    };

                    cb(null, rOptions);
                });
            },

            function makeDownloadRequest(rOptions, cb) {
                that._request(rOptions, function(error, response, fileBuffer) {
                    if(error) {
                        cb(error);
                    } else if(response.statusCode !== 200) {
                        cb('Error with torrent download : '+ response.statusCode);
                    } else {
                        cb(null, fileBuffer);
                    }
                });
            }
        ], function(err, fileBuffer) {
            callback(err, fileBuffer);
        });
    },

    /*********************************************************
     * "Private" methods (not private at all, just no reason to use them outside)
     ********************************************************/

    /**
     *  Wrapper arround the request module, set default options
     */
    _request: function(options, callback) {
        // Headers not set in the options, create empty object
        if(!('headers' in options) || typeof options.headers != 'object') {
            options.headers = {};
        }

        options.headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_3) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.65 Safari/537.31';
        options.followAllRedirects = true;
        options.jar = this._cookies;
        options.timeout = this.options.timeout; // We add a timeout to the request, for slow trackers to not block others

        // We define the right request params regarding the method used
        if('params' in options) {
            if (options.method === 'GET') {
                options.qs = options.params;
            } else  {
                options.form = options.params;
            }

            delete options.params;
        }
        
        // Send the request
        request(options, callback);
    },

    /**
     *  Check for string/element inside the provided body to check for login success/failure
     */
    _checkLoginSuccess: function(body) {
        return true;
    },

    /**
     *  Returns the fields & headers to send to the tracker for login
     *  Needs to be overridden with each tracker's specific fields
     */
    _getLoginData: function(callback) {
        callback({
            'method': '', // POST, GET
            'fields': {
                
            },
            'headers': {
                
            }
        });
    },

    /**
     *  Returns the fields & headers to send to the tracker for search
     *  Needs to be overridden with each tracker's specific fields
     */
    _getSearchData: function(query, options, callback) {
        callback({
            'method': '', // POST, GET
            'fields': {
                
            },
            'headers': {
                
            }
        });
    },

    /**
     *  Returns details to parse the search results
     *  Needs to be overridden with each tracker's specific fields
     */
    _getParseData: function(callback) {
        callback({
            'item': '',
            'detailsLink': '',
            'title': '',
            'size': '',
            'seeders': '',
            'leechers': '',
            'data': {
                'field': {
                    'selector': '',
                    'regex': ''
                }
            }
        });
    },

    /**
     *  Returns the fields & headers to send to the tracker for download
     *  Needs to be overridden with each tracker's specific fields
     */
    _getDownloadData: function(torrent, callback) {
        callback({
            'method': '', // POST, GET
            'fields': {
                
            },
            'headers': {
                
            }
        });
    }
};

module.exports = Tracker;