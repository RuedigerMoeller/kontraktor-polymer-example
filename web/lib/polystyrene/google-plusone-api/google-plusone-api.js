
/**
Dynamically loads the Google+ JavaScript API, firing the `api-load` event when ready.

Any number of components can use `<google-plusone-api>` elements, and the library will only be loaded once.
*/
  Polymer({

    is: 'google-plusone-api',

    behaviors: [
      Polymer.IronJsonpLibraryBehavior
    ],

    properties: {

      /** @private */
      libraryUrl:  {
        type: String,
        value: 'https://apis.google.com/js/plusone.js?onload=%%callback%%'
      },

      /**
       * Fired when the API library is loaded and available.
       * @event js-api-load
       */
      /**
       * Name of event fired when library is loaded and available.
       */
      notifyEvent:  {
        type: String,
        value: 'api-load'
      }

    },

    get api() {
      return gapi;
    }

  });
