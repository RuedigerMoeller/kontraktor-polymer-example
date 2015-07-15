
/**
Dynamically loads the Google Youtube Iframe API, firing the `api-load` event when ready.

Any number of components can use `<google-youtube-api>` elements, and the library will only be loaded once.

https://developers.google.com/youtube/iframe_api_reference
 */
  Polymer({

    is: 'google-youtube-api',

    behaviors: [
      Polymer.IronJsonpLibraryBehavior
    ],

    properties: {

      /** @private */
      libraryUrl:  {
        type: String,
        value: 'https://www.youtube.com/iframe_api'
      },

      /**
       * Fired when the API library is loaded and available.
       * @event api-load
       */
      /**
       * Name of event fired when library loads.
       */
      notifyEvent:  {
        type: String,
        value: 'api-load'
      },

      callbackName:  {
        type: String,
        value: 'onYouTubeIframeAPIReady'
      }

    },

    get api() {
      return YT;
    }

  });
