var Tracker = require('../Tracker');
var util = require('util');
var utils = require('../utils');
var cheerio = require('cheerio');

var Smartorrent = function() {
    Smartorrent.super_.apply(this, arguments);
};

utils.inherits(Smartorrent, Tracker, {
    name: 'Smartorrent',

    _urls: {
        'home':       'http://www.smartorrent.com/',
        'login':      'http://www.smartorrent.com/dispatcheur.php?op=user_login&login_remember=on',
        'loginCheck': 'http://www.smartorrent.com/',
        'search':     'http://www.smartorrent.com/?page=search&ordre=sd',
        'download':   'http://www.smartorrent.com/?page=download'
    },

    _cats: {
        'movie': {
            'dvdrip': { 'cat': 11 },
            'bluray': { 'cat': 26 },
            'screener': { 'cat': 2 }
        },
        'tvshow': {
            'dvdrip': {},
            'bluray': {},
            'screener': {}
        }
    },

    _checkLoginSuccess: function(body) {
        return (body.indexOf('page=abonnement') != -1);
    },

    _getLoginData: function(callback) {
        callback({
            'method': 'POST',
            'fields': {
                'login_username': this._login.username,
                'login_password': this._login.password,
                'op': 'user_login',
                'login_remember': 'on'
            },
            'headers': {
                'Referer': 'http://www.smartorrent.com/',
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
                'page': 'search',
                'ordre': 'sd',
                'term': query
            },
            'headers': {
                'Referer': 'http://www.smartorrent.com/',
	            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
	            'Connection': 'keep-alive'
            }
        });
    },

    _getParseData: function(callback) {
        callback({
            'item': 'table#parcourir tbody tr',
            'detailsLink': 'td.nom div+a',
            'title': 'td.nom div+a',
            'size': 'td.taille',
            'seeders': 'td.seed',
            'leechers': 'td.leech',
            'data': {
                'id': {
                    'selector': 'td.nom div+a',
                    'regex': '/([0-9]+)/'
                }
            }
        });
    },

    _getDownloadData: function(torrent, callback) {
        callback({
            'method': 'GET',
            'fields': {
                'page': 'download',
                'tid': torrent.data.id
            },
            'headers': {
                "Referer": "http://www.smartorrent.com/",
            }
        });
    }
});

module.exports = Smartorrent;
