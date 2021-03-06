var fs = require('fs');
var path = require('path');
var async = require('async');

var Tracker = require('./Tracker');
var utils = require('./utils');
var defaultLogger = require('./logger');

var TorrentsSearch = function(options) {
    this.logger = options.logger || defaultLogger;

    this.options = {
        timeout: options.timeout || 10000
    };

    this.trackers = []; // Array of loaded trackers
};

TorrentsSearch.prototype = {
    trackersDir: path.join(__dirname, 'trackers/'),

    // Get all trackers
    getTrackers: function() {
        var that = this;

        var trackers = {
            enabled: [],
            disabled: []
        };
        
        this.trackers.forEach(function(tracker) {
            if(tracker.enabled === true) {
                trackers.enabled.push(tracker.name);
            } else {
                trackers.disabled.push(tracker.name);
            }
        });
            
        return trackers;
    },
        
    // Load all trackers
    loadTrackers: function(callback) {
        callback = callback || function(err) {};

        var that = this;
        
        fs.readdir(this.trackersDir, function (err, files) {
            if(err) { that.logger.error(err); callback(err); }

            files.forEach(function(file) {
                var filePath = path.join(that.trackersDir, file);
                that.trackers.push(new (require(filePath))(that.options));
            });

            callback();
        });
    },

    // Enable tracker
    enableTracker: function(trackerName) {
        var tracker = this._findTracker(trackerName);
        if(tracker != null) {
            tracker.enabled = true;
            return true;
        } else {
            this.logger.error('['+trackerName+'] Cannot enable. Tracker not found.');
            return false;
        }
    },

    // Disable tracker
    disableTracker: function(trackerName) {
        var tracker = this._findTracker(trackerName);
        if(tracker != null) {
            tracker.enabled = false;
            return true;
        } else {
            this.logger.error('['+trackerName+'] Cannot disable. Tracker not found.');
            return false;
        }
    },
        
    // Set trackers credentials
    setCredentials: function(trackerName, username, password) {
        var tracker = this._findTracker(trackerName);
        if(tracker != null) {
            tracker.setCredentials(username, password);
            return true;
        } else {
            this.logger.error('['+trackerName+'] Cannot set credentials. Tracker not found.');
            return false;
        }
    },
        
    // Login on each trackers
    login: function(callback) {
        callback = callback || function(status) {};
        var that = this;
        var error = false;

        async.each(this.trackers, function(tracker, cbi) {
            if(tracker.enabled === false) { cbi(); return; }

            that.logger.info('['+tracker.name+'] Start login...');
            tracker.login(function(err) {
                if(err) { 
                    that.logger.error(err);
                    error = err;
                } else {
                    that.logger.info('['+tracker.name+'] Logged in !');
                }
                
                cbi();
            });
        }, function() {
            callback(error);
        });
    },
        
    // Search for a torrent
    search: function(searchText, type, callback) {
        callback = callback || function(trackers) {};

        var that = this;
        var allTorrents = [];

        this.login(function(err) {        
            async.each(that.trackers, function(tracker, cbi) {
                if(tracker.enabled === false) { cbi(); return; }

                that.logger.info('['+tracker.name+'] Starting search for "'+ searchText +'"...');
                tracker.search(searchText, type, function(error, torrents) {
                    if(error) { 
                        that.logger.error('['+tracker.name+'] Error during search : '+ error +'.');
                    } else if(torrents.length === 0) { 
                        that.logger.info('['+tracker.name+'] No torrent found for "'+ searchText +'".');
                    } else {
                        that.logger.info('['+tracker.name+'] '+ torrents.length +' torrent(s) found for "'+ searchText +'".');
                        
                        allTorrents = allTorrents.concat(torrents);
                    }

                    cbi();
                });
            }, function(err) {
                callback(null, allTorrents);
            });
        });
    },

    download: function(torrent, callback) {
        var tracker = this._findTracker(torrent.tracker);
        
        if(tracker !== null) {
            if(tracker.enabled) {
                tracker.download(torrent, callback);
            } else {
                this.logger.error('['+tracker.name+'] Cannot download torrent. Tracker not enabled.');
                callback('Tracker not enabled.');
            }
        } else {
            this.logger.error('['+trackerName+'] Cannot download torrent. Tracker not found.');
            callback('Tracker not found.');
        }
    },

    // Return the tracker object from the tracker's name
    _findTracker: function(trackerName) {
        var tracker = null;

        this.trackers.forEach(function(t) {
            if(t.name == trackerName) {
                tracker = t;
            }
        });

        return tracker;
    }
};

module.exports = TorrentsSearch;