
/**
Dynamically loads Google JavaScript API `gapi`, firing the `js-api-load` event when ready.

Any number of components can use `<google-js-api>` elements, and the library will only be loaded once.

##### Example

    <google-js-api></google-js-api>
    <script>
      var api = document.querySelector('google-js-api');
      api.addEventListener('js-api-load', function(e) {
        console.log('API loaded', gapi);
      });
    < /script>

*/
  Polymer({

    is: 'google-js-api',

    behaviors: [
      Polymer.IronJsonpLibraryBehavior
    ],

    properties: {

      /** @private */
      libraryUrl: {
        type: String,
        value: 'https://apis.google.com/js/api.js?onload=%%callback%%'
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
        value: 'js-api-load'
      },
    },

    get api() {
      return gapi;
    }

  });
