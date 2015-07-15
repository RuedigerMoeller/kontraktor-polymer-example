
/**
Dynamically loads the Google Drive Realtime API, firing the `api-load` event when ready.

Any number of components can use `<google-realtime-api>` elements, and the library will only be loaded once.

*/
  Polymer({

    is: 'google-realtime-api',

    behaviors: [
      Polymer.IronJsonpLibraryBehavior
    ],

    properties: {

      /** @private */
      libraryUrl:  {
        type: String,
        value: 'https://apis.google.com/js/drive-realtime.js?onload=%%callback%%'
      },

       /**
       * Fired when the API library is loaded and available.
       * @event api-load
       */
      /**
       * Name of event fired when library is loaded and available.
       */
      notifyEvent:  {
        type: String,
        value: 'api-load'
      }

    },

    /**
     * Returns `gapi.drive.realtime`
     */
    get api() {
      return gapi.drive.realtime;
    }

  });
