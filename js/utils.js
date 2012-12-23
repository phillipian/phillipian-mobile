// http://coenraets.org/blog/2012/03/employee-directory-sample-app-with-backbone-js-and-jquery-mobile/

tpl = {

    // Hash of preloaded templates for the app
    templates:{},

    // Recursively pre-load all the templates for the app.
    // This implementation should be changed in a production environment. All the template files should be
    // concatenated in a single file.
    loadTemplates: function (names, callback) {

        var that = this;

        var loadTemplate = function (index) {
            var name = names[index];
            console.log('Loading template: ' + name);
            $.get('tpl/' + name + '.tpl.html', function (data) {
                that.templates[name] = data;
                index++;
                if (index < names.length) {
                    loadTemplate(index);
                } else {
                    callback();
                }
            }, 'html');
        }

        loadTemplate(0);
    },

    // Get template by name from hash of preloaded templates
    get: function (name) {
        return this.templates[name];
    }

};

/**
 * 
 * Phonegap share plugin for Android
 * Kevin Schaul 2011
 *
 */

var Share = function() {};
            
Share.prototype.show = function(content, success, fail) {
    return cordova.exec( function(args) {
        success(args);
    }, function(args) {
        fail(args);
    }, 'Share', '', [content]);
};

if(!window.plugins) {
    window.plugins = {};
}
if (!window.plugins.share) {
    window.plugins.share = new Share();
}


// Application Preferences Plugin 
// https://github.com/macdonst/AppPreferences

cordova.define("cordova/plugin/applicationpreferences", function(require, exports, module) {
	var exec = require("cordova/exec");
	var AppPreferences = function () {};

	var AppPreferencesError = function(code, message) {
	this.code = code || null;
	this.message = message || '';
	};

	AppPreferencesError.NO_PROPERTY = 0;
	AppPreferencesError.NO_PREFERENCE_ACTIVITY = 1;

	AppPreferences.prototype.get = function(key,success,fail) {
	cordova.exec(success,fail,"applicationPreferences","get",[key]);
	};

	AppPreferences.prototype.set = function(key,value,success,fail) {
	cordova.exec(success,fail,"applicationPreferences","set",[key, value]);
	};

	AppPreferences.prototype.load = function(success,fail) {
	cordova.exec(success,fail,"applicationPreferences","load",[]);
	};

	AppPreferences.prototype.show = function(activity,success,fail) {
	cordova.exec(success,fail,"applicationPreferences","show",[activity]);
	};

	AppPreferences.prototype.clear = function(success,fail) {
	cordova.exec(success,fail,"applicationPreferences","clear", []);
	};

	AppPreferences.prototype.remove = function(keyToRemove, success,fail) {
	cordova.exec(success,fail,"applicationPreferences","remove", [keyToRemove]);
	};

	var appPreferences = new AppPreferences();
	module.exports = appPreferences;
	});