var Tracker = require('../Tracker');
var util = require('util');
var utils = require('../utils');
var cheerio = require('cheerio');

var Frenchtorrentdb = function() {
    Frenchtorrentdb.super_.apply(this, arguments);
};

utils.inherits(Frenchtorrentdb, Tracker, {
    name: 'FrenchTorrentDB',

    _urls: {
        'home':       'http://www.frenchtorrentdb.com/',
        'login':      'http://www.frenchtorrentdb.com/?section=LOGIN&ajax=1',
        'loginCheck': 'http://www.frenchtorrentdb.com/',
        'search':     'http://www.frenchtorrentdb.com/',
        'download':   'http://www.frenchtorrentdb.com/'
    },

    _cats: {
        'movie': {
            'dvdrip': { 
                'adv_cat[m][1]': '71',
                'group': 'films',
                'year': '',
                'year_end': ''
            },
            'bluray': {  },
            'screener': {  }
        },
        'tvshow': {
            'dvdrip': {},
            'bluray': {},
            'screener': {}
        }
    },

    _checkLoginSuccess: function(body) {
        return (body.indexOf('"success":true') != -1);
    },

    _getLoginData: function(callback) {
        var that = this;

        // Get challenge/hash from FrenchTorrentDB
        that._request({url: 'http://www.frenchtorrentdb.com/?section=LOGIN&challenge=1', method: 'GET', json: true}, function(error, response, data) {
            if(error || response.statusCode !== 200) {
                utils.log(error); utils.log(response.statusCode); 
                utils.log('['+that.config.name+'] FrenchTorrentDB login error.'); 
                callback(false); 
                return;
            }
        
            var hash = data.hash;
            var challenge;

            (function(hash) {
                'use strict'; // With strict mode, eval will not leak in the immediate scope (http://stackoverflow.com/a/10491365/1160800)
                challenge = '';
                for (var i in data.challenge) {
                    challenge += '' + eval("var a = '05f';"+data.challenge[i]);
                }
            }(hash));

            callback({
                'method': 'POST',
                'fields': {
                    'username': that._login.username,
                    'password': that._login.password,
                    'url': '/',
                    'remember': '1',
                    'hash': hash,
                    'secure_login' : challenge
                },
                'headers': {
                    'Referer': 'http://www.frenchtorrentdb.com/?section=LOGIN&Func=access_denied&access_needed',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Connection': 'keep-alive'
                }
            });
        });
    },

    _getSearchData: function(query, options, callback) {
        callback({
            'method': 'GET',
            'fields': {
                'search': 'Rechercher',
                'exact': '1',
                'section': 'TORRENTS',
                'order_by': 'seeders',
                'order': 'DESC',
                'name': query
            },
            'headers': {
                'Referer': 'http://www.frenchtorrentdb.com/?section=TORRENTS',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Connection': 'keep-alive'
            }
        });
    },

    _getParseData: function(callback) {
        callback({
            'item': '.results_index .DataGrid ul',
            'detailsLink': 'a.torrents_name_link',
            'title': 'a.torrents_name_link',
            'size': 'li.torrents_size',
            'seeders': 'li.torrents_seeders',
            'leechers': 'li.torrents_leechers',
            'data': {
                'id': {
                    'selector': 'li.torrents_download a',
                    'regex': '(&|&amp;)id=([0-9]+)'
                },
                'uid': {
                    'selector': 'li.torrents_download a',
                    'regex': '(&|&amp;)uid=([0-9]+)'
                },
                'hash': {
                    'selector': 'li.torrents_download a',
                    'regex': '(&|&amp;)hash=([a-z0-9]+)'
                }
            }
        });
    },

    _getDownloadData: function(torrent, callback) {
        callback({
            'method': 'GET',
            'fields': {
                'section': 'DOWNLOAD',
                'id': torrent.data.id,
                'uid': torrent.data.uid,
                'hash': torrent.data.hash
            },
            'headers': {
                'Referer': 'http://www.frenchtorrentdb.com/'
            }
        });
    }
});

module.exports = Frenchtorrentdb;
