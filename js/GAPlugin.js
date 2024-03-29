(function(){
    var cordovaRef = window.PhoneGap || window.Cordova || window.cordova;

    function GAPlugin() { }

    // initialize google analytics with an account ID and the min number of seconds between posting
    //
    // id = the GA account ID of the form 'UA-00000000-0'
    // period = the minimum interval for transmitting tracking events if any exist in the queue
    GAPlugin.prototype.init = function(success, fail, id, period) {
        return cordovaRef.exec(success, fail, 'GAPlugin', 'initGA', [id, period]);
    };

    // log an event
    //
    // category = The event category. This parameter is required to be non-empty.
    // eventAction = The event action. This parameter is required to be non-empty.
    // eventLabel = The event label. This parameter may be a blank string to indicate no label.
    // eventValue = The event value. This parameter may be -1 to indicate no value.
    GAPlugin.prototype.trackEvent = function(success, fail, category, eventAction, eventLabel, eventValue) {
        return cordovaRef.exec(success, fail, 'GAPlugin', 'trackEvent', [category, eventAction, eventLabel, eventValue]);
    };


    // log a page view
    //
    // pageURL = the URL of the page view
    GAPlugin.prototype.trackPage = function(success, fail, pageURL) {
        return cordovaRef.exec(success, fail, 'GAPlugin', 'trackPage', [pageURL]);
    };

    // Set a custom variable. The variable set is included with
    // the next event only. If there is an existing custom variable at the specified
    // index, it will be overwritten by this one.
    //
    // key = the name of the variable you are logging
    // value = the value of the variable you are logging
    // index = the numerical index of the key / value pair (base 1)
    //  Standard accounts support up to 5 custom variables, while premium
    //  accounts support up to 50. The SDK will accept custom
    //  variable indices higher than 5, but unless the account is a premium account,
    //  those custom variables will not be processed.
    GAPlugin.prototype.setVariable = function(success, fail, key, value, index) {
        return cordovaRef.exec(success, fail, 'GAPlugin', 'setVariable', [key, value, index]);
    };
    
    GAPlugin.prototype.exit = function(success, fail) {
        return cordovaRef.exec(success, fail, 'GAPlugin', 'exitGA');
    };
 
    cordovaRef.addConstructor(function() {
        if(!window.plugins) {
            window.plugins = {};
        }
        if(!window.plugins.gaPlugin) {
            window.plugins.gaPlugin = new GAPlugin();
        }
    });
})(); /* End of Temporary Scope. */