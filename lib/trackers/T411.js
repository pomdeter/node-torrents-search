var Tracker = require('../Tracker');
var util = require('util');
var utils = require('../utils');
var cheerio = require('cheerio');

var T411 = function() {
    T411.super_.apply(this, arguments);
};

utils.inherits(T411, Tracker, {
    name: 't411',

    _urls: {
        'home':       'http://www.t411.me/',
        'login':      'http://www.t411.me/users/auth/',
        'loginCheck': 'http://www.t411.me/',
        'search':     'http://www.t411.me/torrents/search/',
        'download':   'http://www.t411.me/torrents/download/'
    },

    _cats: {
        'movie': {
            'dvdrip': { 
                'cat': '210',
                'subcat': '631',
                'term[17][]': '541'
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
        return (body.indexOf('"status":"OK"') != -1);
    },

    _getLoginData: function(callback) {
        callback({
            'method': 'POST',
            'fields': {
                'login': this._login.username,
                'password': this._login.password,
                'url': '/',
                'remember': '1'
            },
            'headers': {
                'Referer': 'http://www.t411.me/',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest',
                'Connection': 'keep-alive'
            }
        });
    },

    _getSearchData: function(query, options, callback) {
        callback({
            'method': 'GET',
            'fields': {
                'submit': 'Recherche',
                'order': 'seeders',
                'type': 'desc',
                'search': query
            },
            'headers': {
                'Referer': 'http://www.t411.me/torrents/search/',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Connection': 'keep-alive'
            }
        });
    },

    _getParseData: function(callback) {
        callback({
            'item': 'table.results tbody tr',
            'detailsLink': 'td+td a:first-child',
            'title': 'td+td a:first-child',
            'size': 'td+td+td+td+td+td',
            'seeders': 'td+td+td+td+td+td+td+td',
            'leechers': 'td+td+td+td+td+td+td+td+td',
            'data': {
                'id': {
                    'selector': 'td+td+td a',
                    'regex': 'id=([0-9]+)'
                }
            }
        });
    },

    _getDownloadData: function(torrent, callback) {
        callback({
            'method': 'GET',
            'fields': {
                'id': torrent.data.id
            },
            'headers': {
                'Referer': 'http://www.t411.me/',
            }
        });
    }
});

module.exports = T411;
