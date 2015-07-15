

  (function() {
    'use strict';

    // Stores whether the URL Shortener API is done loading.
    var apiLoaded_ = false;

    Polymer({

      is: 'google-url-shortener',

      /**
      * Fired when the component is ready for shortening.
      *
      * @event google-url-shortener-ready
      */

      /**
       * Fired when the URL gets successfully shortened.
       *
       * @event google-url-shorten
       */

      /**
       * Fired if an attempt to shorten a URL results in an error.
       *
       * @event google-url-shorten-error
       */

      properties: {
        /**
         * The URL to be shortened.
         */
        longUrl: {
          type: String,
          value: '',
          observer: '_longUrlChanged'
        },

        /**
         * Shortened URL
         */
        shortUrl: {
          type: String,
          value: '',
          notify: true
        },

        /**
         * Error when url was shortened
         */
        error: {
          type: String,
          value: '',
          notify: true
        },
        /**
         * If true, automatically performs the shortening request when `longUrl`
         * changes.
         */
        auto: {
          type: Boolean,
          value: false
        }
      },

      _readyForAction: function() {
        apiLoaded_ = true;
        this.fire('google-url-shortener-ready');
      },

      _apiLoadError: function(event) {
        this.fire('api-error', {
          'error': {
            'message': 'Error loading URL Shortener API',
            'innerError': event.detail
          }
        });
      },

      _longUrlChanged: function() {
        if (this.auto) {
          this.shorten();
        }
      },

      /**
       * Shortens the URL in `longUrl`. Use if `auto` is not set.
        */
      shorten: function() {
        if (apiLoaded_) {
          if (this.longUrl) {
            var request = this.$.urlshortener.api.url.insert(
                {resource: {longUrl: this.longUrl}});

            request.execute(function(response) {
              if (response && response.id) {
                this.shortUrl = response.id;
                this.error = '';
                this.fire('google-url-shorten', {shortUrl: response.id});
              } else {
                this.error = response && response.error ? response.error.message : 'Unknown error';
                this.fire('google-url-shorten-error', {error: this.error});
              }
            }.bind(this));
          }
        }
      }

    });
  })();

