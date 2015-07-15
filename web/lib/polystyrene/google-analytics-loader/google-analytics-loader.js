
  (function() {

    'use strict';

    Polymer({

      is: 'google-analytics-loader',

      properties: {
        /**
         * True when user is authorized, and api is loaded
         * @attribute allReady
         * @type {Boolean}
         */
        allReady: {
          type: Boolean,
          computed: 'computeAllReady(apiReady, authorized)',
          notify: true
        },
        /**
         * True when api is loaded
         * @attribute apiReady
         * @type {Boolean}
         */
        apiReady: {
          type: Boolean,
          value: false,
          notify: true,
          readOnly: true
        },
        /**
         * True when user is authorized
         * @attribute authorized
         * @type {Boolean}
         */
        authorized: {
          type: Boolean,
          value: false,
          notify: true,
          readOnly: true
        }
      },

      computeAllReady: function(apiReady, authorized) {
        return apiReady && authorized;
      },

      handleApiLoad: function() {
        this._setApiReady(true);
      },

      handleApiFailedToLoad: function(ev, detail) {
        this._setApiReady(false);
        console.error("Api failed to load: ", this.$.api.name, this.$.api.version);
      },

      handleAuthSuccess: function() {
        this._setAuthorized(true);
      },

      handleAuthSignout: function() {
        this._setAuthorized(false);
      }
    });

  })();

