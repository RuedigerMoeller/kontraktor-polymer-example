
(function() {
  Polymer({

    is: 'google-feeds',

    /**
     * Fired when feed has been loaded
     * @param {object} feed feed object
     * @event google-feeds-response
     */
    /**
     * Fired when feed load fails
     * @param {string} status load status
     * @event google-feeds-error
     */
     /**
      * Fired when multiple feeds have loaded successfully
      * @param {object} feeds multiple feeds
      * @event google-multi-feeds-response
      */
     /**
      * Fired when feed query fails
      * @param {string} status status
      * @event google-feeds-queryerror
      */
     /**
      * Fired when feed query succeeds
      * @param {object} entries query results
      * @event google-feeds-queryresponse
      */

    properties: {

      /**
       * url of the feed to fetch.
       */
      feed: {
        type: String,
        observer: '_feedChanged'
      },

      /**
       * An array of multiple feeds. Feed will load, and report results in `google-feeds-response` event.
       */
      feeds: {
        type: Array,
        value: function() { return []; },
        observer: '_feedsChanged'
      },

      /**
       * Result of loading a single feed url
       */
      results: {
        type: Object,
        value: null,
        notify: true
      },

      /**
       * Query for google.feeds.findFeeds(). Query result will be reported through `google-feeds-queryresponse` event
       */
      query: {
        type: String,
        observer: '_queryChanged'
      },

      /**
       * Number of feed items to fetch in fetchFeed
       */
      count: {
        type: Number,
        value: 32
      },

      /**
       * True if feeds API is loading an item
       */
      loading: {
        type: Boolean,
        notify: true
      }
    },

    attached: function() {
      this.pendingFeeds = [];
    },

    _feedChanged: function() {
      if (this.feed) {
        this.loading = true;
        // call fetchFeeds async to make sure any binding to count property
        // is resolved before fetchFeeds is called
        this._withFeedsApi(this._fetchFeeds.bind(this));
      } else {
        this.results = null;
      }
    },

    _fetchFeeds: function() {
      var feed = new google.feeds.Feed(this.feed);
      feed.includeHistoricalEntries(); // tell the API we want to have old entries too
      feed.setNumEntries(this.count); // we want this maximum number of entries, if they exist
      feed.load(this._fetchFeedsDone.bind(this));
    },

    _fetchFeedsDone: function(results) {
      this.loading = false;
      if (results.error) {
        this.results = {};
        this.fire('google-feeds-error', {status: results.status});
      } else {
        this.results = results.feed;
        this.fire('google-feeds-response', {feed: results.feed});
      }
    },

    _feedsChanged: function() {
      this._withFeedsApi(function(item) {
        this._fetchMultipleFeeds(this.feeds, function(results) {
          // TODO: Figure out why the onLoad callback
          // isn't getting fired. Below isn't fired.
          this.fire('google-multi-feeds-response', { feeds: results });
        });
      }.bind(this));
    },

    _fetchMultipleFeeds: function(feeds, onLoad) {
      var feedControl = new google.feeds.FeedControl();
      if (feeds) {
        feeds.forEach(function(item) {
          feedControl.addFeed(item);
        });
        feedControl.setNumEntries(this.count);
        feedControl.draw(this.$.content);
        google.setOnLoadCallback(onLoad);
      }
    },

    _queryChanged: function() {
      if (this.query) {
        this.loading = true;
        this._withFeedsApi(this._findFeeds.bind(this));
      }
    },

    _findFeeds: function() {
      google.feeds.findFeeds(this.query, this._findFeedsDone.bind(this));
    },

    _findFeedsDone: function(results) {
      this.loading = false;
      if (results.error) {
        this.fire('google-feeds-queryerror', {status: results.status});
      } else {
        this.fire('google-feeds-queryresponse', {entries: results.entries});
      }
    },

    // TODO(ffu): integrate the ability to load a specific api like feeds
    // into google-jsapi.
    _feedsCallbacks: [],

    _feedsApiLoaded: function() {
      while (this._feedsCallbacks.length) {
        var fn = this._feedsCallbacks.shift();
        fn();
      }
    },

    _isApiLoaded: function() {
      return !!(window.google && google.feeds && google.feeds.Feed);
    },

    _withFeedsApi: function(callback) {
      if (this._isApiLoaded() && callback) {
        callback();
      } else {
        if (!this.feedsApiLoading) {
          var loaded = this._feedsApiLoaded.bind(this);
          var loader = document.createElement('google-legacy-loader');
          loader.addEventListener('api-load', function(e) {
            google.load('feeds', '1', {callback: loaded});
          });
          this.feedsApiLoading = true;
        }
        if (callback) {
          this._feedsCallbacks.push(callback);
        }
      }
    }

  });
})();
