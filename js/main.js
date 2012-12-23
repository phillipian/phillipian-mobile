// Based off of http://coenraets.org/blog/2011/12/backbone-js-wine-cellar-tutorial-part-1-getting-started/

// Article model - holds the data for an individual article
window.Article = Backbone.Model.extend({
	initialize: function() {
		console.log("initializing article nid: " + this.get('nid'));
		
		// parse date string into user-viewable format
		if (this.get('issue_date') != null)
			var date = moment(this.get('issue_date'));
		else
			var date = moment(this.get('article_date'));
		
		// generate teaser
		// http://stackoverflow.com/questions/4637942/how-can-i-truncate-a-string-in-jquery
		var teaser = $.trim(this.get('body')).substring(0, 180).split(" ").slice(0, -1).join(" ") + "...";
		
		this.set({
			publishedDateShort: date.format('M/D'),
			publishedDateLong: date.format('dddd, MMMM Do, YYYY'),
			teaser: teaser,
			image: $(this.get('image')).removeAttr('width').removeAttr('height').wrap('<p>').parent().html()
		});
	},
	
	// use drupal nid as the unique identifier
	idAttribute: "nid"
});

// Article collection - holds a group of articles
window.ArticleCollection = Backbone.Collection.extend({
	initialize: function(sectionName) {
		if (sectionName == undefined)
			this.section = 'all';
		else
			this.section = sectionName;
		
		// set page index for when additional articles are requested
		this.currentPage = 0;
	},
	model: Article,
	
	url: function() {
		return "http://www.phillipian.net/mobile/views/services_article_list.jsonp?args=" + this.section;
	},
	
	sync: function (method, model, options) {
		options || (options = {});
		options.dataType = "jsonp";
	    return Backbone.sync(method, model, options);
	},
	
	loadMoreArticles: function() {	
		window.lastPosition = $('#article-list').scrollTop();
    	console.log("Fetching more articles");
    	
    	$.mobile.loading('show', {
    		text: 'Loading more articles...',
    		textVisible: true,
    	});
    	
    	this.currentPage++;
    	
    	this.fetch({
			add: true,
			data: {page: this.currentPage},
			success: function() {
				$.mobile.loading('hide');
			}
		});
	}
});

// VIEWS

// view for the latest articles or articles by section
window.MainPageView = Backbone.View.extend({
	initialize: function() {
		this.template = _.template(tpl.get('main-page'));
	},
	id : 'main-page',
    render: function (eventName) {
		$(this.el).html(this.template());
        return this;
    }
});

// view for MainPageView - ul container for li elements generated by ArticleListItemView
window.ArticleListView = Backbone.View.extend({
	initialize: function () {
        this.collection.bind("reset", this.render, this); // when the collection is reset, render this view!
        this.collection.bind("add", this.append, this); // when the models are added to the collection, trigger the append method!
    },
    
    tagName: 'ul',
    
    attributes: {
    	class: 'scroll',
    	id: 'article-list'
    },
  
    render: function (eventName) {	
    	$(this.el).listview(); // initialize the jQuery listview
    	
        _.each(this.collection.models, function (article) {
            $(this.el).append(new ArticleListItemView({model:article}).render().el);
        }, this);
        
        $(this.el).append('<li data-icon="false"><a class="load-more-link">Load more articles...</a></li>');
        
        $(this.el).listview("refresh"); // refresh to stylize the list!
    	
        $.mobile.loading('hide'); // hide any loading messages that may be up right now
        
        $('.load-more-link').click(function() {app.articleList.loadMoreArticles();});
        
        return this;
    },
    
    append: function (model) {
    	$(this.el).children('.article-list-item:last').after(new ArticleListItemView({model:model}).render().el);
 
    	$(this.el).listview("refresh");
    }
});

// view for ArticleListView - renders the individual li elements inside of the ul generated by ArticleListView
window.ArticleListItemView = Backbone.View.extend({
	initialize: function() {
    	this.template = _.template(tpl.get('article-list-item'));
    },
    tagName: 'li',
    attributes: {
    	'class': 'article-list-item',
    	'data-icon': 'false' // remove the silly jQuery arrow that is by default on each li element in listviews
    },
    render: function (eventName) {
    	try {
    		$(this.el).html(this.template(this.model.toJSON()));
    	} catch (e) {
    		console.log(e);
    	}
        return this;
    }
});

// view for article page - pretty basic
window.ArticlePageView = Backbone.View.extend({
	initialize: function() {
    	this.template = _.template(tpl.get('article-page'));
    },
	attributes: {
		class: 'article-page'
	},
    render: function (eventName) {
		$(this.el).html(this.template(this.model.toJSON()));
        return this;
    }
});

window.loginPageView = Backbone.View.extend({
	initialize: function() {
		this.template = _.template(tpl.get('login-page'));
	},
	render: function (eventName) {
		$(this.el).html(this.template());
        return this;
    }
});

// the primary controller of the app
window.AppRouter = Backbone.Router.extend({
	initialize: function () {
		console.log("Initializing app router.");
		//window.localStorage.clear();
		
		this.loggedIn = false;
		this.user = null;
    },
    
    // defining the routes inside of the app
	routes: {
        "": "main",
        "main-page": "main",
        "article/:nid": "article",
        "login": "login"
    },
    
    main: function() {
    	console.log("Changing to main view");
    	
    	if ($('body').has('#main-page').length > 0) {
    		
    		console.log('Page already exists. Just transition to it!')
    		$.mobile.changePage('#main-page', {transition: 'fade', changeHash: false});
    		//this.navigate("");
    		
    	} else {
    		
    		var self = this;
    		
	    	this.articleList = this.getArticles('all', function() {
	    		if (self.requestedNid) {
	    			console.log("Go back to the originally requested article");
	    			self.article(self.requestedNid);
	    		}
	    	});
	    	
	        this.articleListView = new ArticleListView({collection: this.articleList});
	        this.mainPageView = new MainPageView();
	        
	    	this.changePage(this.mainPageView);
	    	
	    	$(this.mainPageView.el).append(this.articleListView.el);
	    	
	    	if (this.articleList.length > 1) // if was loaded from cache, need to manually trigger the render
				this.articleListView.render();
	    	else {
				$.mobile.loading('show', {
		    		text: 'Loading articles...',
		    		textVisible: true,
		    	});			
	    	}
			
	        $('.section-select-menu').change(function(e) {
	        	$.mobile.loading('show', {
		    		text: 'Loading articles...',
		    		textVisible: true,
		    	});
	        	
	        	self.changeSection($(this).val());
	    	});	
	        
	        /*
	        $.post('http://www.phillipian.net/mobile/system/connect.json', function(data) {
				app.user = data.user;
				if (app.user.uid == 0) {
					// not logged in
				}
				else {
					// logged in
					console.log("logged in " + app.user.name);
					app.loggedIn = true;
					
					app.addUserToolbar();
				}
			});*/
    	}
    },
    
    article: function (nid) {
    	console.log("Changing to article view (nid: " + nid + ")");
    	if (this.articleList != undefined || this.requestedNid != undefined) {
    		this.currentArticle = this.articleList.get(nid);
    		
            this.articlePageView = new ArticlePageView({model: this.currentArticle});
            
            this.changePage(this.articlePageView);
        	
        	window.disqus_shortname = 'phillipian';
        	window.disqus_url = 'http://phillipian.net/node/' + this.currentArticle.get('nid');
        	
        	console.log("load disqus for " + disqus_url);
        	
        	/* * * DON'T EDIT BELOW THIS LINE * * */
        	/*(function() {
        	    var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
        	    dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
        	    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
        	})(); */
            
            //$('.article-comments').load('http://p.phillipian.net/disqus-comments.html', {nid: this.article.get('nid')});
        	//var myScroll = new iScroll('content-wrapper');
    	}
    	else {
    		// this doesn't quite work yet
    		console.log("We need to load the articles first. Go back to the main view and then come back.")
    		this.requestedNid = nid;
            this.main();
    	}
    },
    
    login: function() {
    	console.log("Changing to login view.");
    	this.changePage(new loginPageView());
    	
    	// http://tylerfrankenstein.com/code/android-app-with-drupal-7-services-phonegap-and-jquery-mobile
    	
    	/*
    	$('#login-form').submit(function() {
    		var username = $('#login-form-username').val();
    		if (!username) { alert('Please enter your username.'); }
    		var password = $('#login-form-password').val();
    		if (!password) { alert('Please enter your password.'); }
    		
    		$.post('http://www.phillipian.net/mobile/user/login.json', { username: username, password: password }, function(data) {
    			console.log("Logged in!");
    			this.user = data.user;
    			this.loggedIn = true;
    			
    			//this.addUserToolbar();
    		});
    		return false;
    	});
    	*/
    },
    
    changePage: function (page) {
        $(page.el).attr('data-role', 'page');
        $(page.el).attr('data-theme', 'a');
        
        page.render();
        
        $('body').append($(page.el));
        
        var transition = $.mobile.defaultPageTransition;
        $.mobile.changePage($(page.el), {transition: transition});
    	
        // bind actions
        $('.back').click(function() {
        	window.history.back();
        });
    },
    
    changeSection: function(section) {
    	$(this.articleListView.el).remove();

    	this.articleList = this.getArticles(section);
    	
    	this.articleListView = new ArticleListView({collection: this.articleList});
    	
    	$(this.mainPageView.el).append(this.articleListView.el);
    },
    
    getArticles: function(section, callback) {
		var newArticleList = new ArticleCollection(section);
		var prevTimestamp = window.localStorage.getItem("articleList-" + section + "-timestamp");
		
		if (prevTimestamp == null || prevTimestamp - new Date().getTime() > 3600000) {
			console.log("Fetching latest articles from section: " + section);
			newArticleList.fetch({success: function(collection, response, options) {
					window.localStorage.setItem("articleList-" + collection.section, JSON.stringify(collection));
					window.localStorage.setItem("articleList-" + collection.section + "-timestamp", new Date().getTime());
				}
			});
		}
		
		else {
			var cachedArticleListData = window.localStorage.getItem("articleList-" + section);

			if (cachedArticleListData != null && cachedArticleListData.length > 0) {
				console.log("Loading from local storage");
				newArticleList.reset($.parseJSON(cachedArticleListData));
				if (newArticleList.length <= 1) {
					window.localStorage.removeItem("articleList-" + section + "-timestamp");	
					return this.getArticles(section, callback);
				}
			}
		}
		
		if(typeof callback == 'function')
			callback();
		
		return newArticleList;
		
		
    },
    
    addUserToolbar: function() {
    	$('#main-page div[data-role="header"]').append(_.template(tpl.get('user-toolbar'), {name: this.user.name}));
    	$('#user-toolbar').navbar();
    },
    
    onDeviceReady: function () {
    	console.log("Cordova is ready...");
        
        // Google Analytics
        gaPlugin = window.plugins.gaPlugin;
        gaPlugin.init(function(e) {console.log(e)}, function(e) {console.log(e)}, "UA-5329517-8", 10);
    },
    
    reloadPreferences: function() {
    	window.preferences.get('pref_font_size', function(value) {window.fontSize = parseInt(value); $('body').css('font-size', value);}, function() {});
    	document.removeEventListener("backbutton", app.reloadPreferences, false);
    }
});

var gaPlugin;

// when jQuery is all set... let's go!
$(document).ready(function() {
	tpl.loadTemplates(['main-page', 'article-page', 'article-list-item', 'login-page', 'user-toolbar'],
	    function () {
	        app = new window.AppRouter();
	        Backbone.history.start();
	        document.addEventListener("deviceready", app.onDeviceReady, false);
	});
});

/*
window.fbAsyncInit = function() {
    FB.init({
      appId      : '216970804999359', // App ID
      status     : true, // check login status
      cookie     : true, // enable cookies to allow the server to access the session
      xfbml      : true  // parse XFBML
    });

    FB.Event.subscribe('auth.statusChange', handleStatusChange);
  };

  // Load the SDK Asynchronously
  (function(d){
     var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement('script'); js.id = id; js.async = true;
     js.src = "//connect.facebook.net/en_US/all.js";
     ref.parentNode.insertBefore(js, ref);
   }(document));
*/