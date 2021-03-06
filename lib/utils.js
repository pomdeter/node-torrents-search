var util = require('util');

// Extend/merge objects
// http://stackoverflow.com/a/14974931/1160800
var extend = exports.extend = function(target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }
    });
    return target;
}

// Custom inherits function
exports.inherits = function(Child, Parent, proto) {
	Child.prototype = Object.create(Parent.prototype);

	// Add/replace child methods by provided ones
	extend(Child.prototype, proto);

	Child.super_ = Parent;
}