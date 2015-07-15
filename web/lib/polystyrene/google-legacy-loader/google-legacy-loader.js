
/**
Dynamically loads the legacy Google JavaScript API Loader (https://developers.google.com/loader/).

Fires `api-load` event when ready.
*/
  Polymer({

    is: 'google-legacy-loader',

    behaviors: [
      Polymer.IronJsonpLibraryBehavior
    ],

    properties: {

      /** @private */
      libraryUrl: {
        type: String,
        value: 'https://www.google.com/jsapi?callback=%%callback%%'
      },

      /**
       * Fired when the API library is loaded and available.
       * @event js-api-load
       */
      /**
       * Name of event fired when library is loaded and available.
       */
      notifyEvent: {
        type: String,
        value: 'api-load'
      }
    },

    /**
     * Wrapper for `google` API namespace.
     */
    get api() {
      return google;
    }
  });
