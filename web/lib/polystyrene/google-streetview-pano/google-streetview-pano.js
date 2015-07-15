
  "use strict";

  Polymer({
    is: 'google-streetview-pano',
      properties: {
      /**
       * A Maps API key. To obtain an API key, see developers.google.com/maps/documentation/javascript/tutorial#api_key.
       */
      apiKey: String,

      /**
       * A Maps API for Business Client ID. To obtain a Maps API for Business Client ID, see developers.google.com/maps/documentation/business/.
       * If set, a Client ID will take precedence over an API Key.
       */
      clientId: String,

      /**
       * The localized language to load the Maps API with. For more information
       * see https://developers.google.com/maps/documentation/javascript/basics#Language
       *
       * Note: the Maps API defaults to the preferred language setting of the browser.
       * Use this parameter to override that behavior.
       *
       */
      language: String,

      /**
       * A comma separated list (e.g. "places,geometry") of libraries to load
       * with this map. Defaults to "places". For more information see
       * https://developers.google.com/maps/documentation/javascript/libraries.
       *
       */
      libraries: {
        type: String,
        value: "places"
      },

      /**
       * Version of the Google Maps API to use.
       *
       */
      version: {
        type: String,
        value: '3.exp'
      },

      /**
       * Specifies which photosphere to load
       *
       * **Required**
       */
      panoId: {
        type: String,
        observer: '_panoIdChanged'
      },

      /**
       * The camera heading in degrees relative to true north. True north is 0°, east is 90°, south is 180°, west is 270°.
       */
      heading: {
        type: Number,
        value: 45
      },

      /**
       * The camera pitch in degrees, relative to the street view vehicle. Ranges from 90° (directly upwards) to -90° (directly downwards).
       */
      pitch: {
        type: Number,
        value: -2
      },

      /**
       * Sets the zoom level of the panorama. Fully zoomed-out is level 0, where the field of view is 180 degrees.
       */
      zoom: {
        type: Number,
        value: 1
      },

      /**
       * If true, disables all default UI.
       */
      disableDefaultUi: {
        type: Boolean,
        value: false
      },

      /**
       * If true, disables the auto panning animation
       */
      disableAutoPan: {
        type: Boolean,
        value: false
      },

    },

    pano: null,
    rAFid: null,
    _mapApiLoaded: function() {
      this.pano = new google.maps.StreetViewPanorama(
          this.$.pano,
          this._getPanoOptions());
      this.pano.setVisible(true);

      if (this.disableAutoPan) {
        return;
      }
      // Kickoff the rotating animation
      this.rAFid = requestAnimationFrame(this.update.bind(this));
    },

    /**
     * Returns the an object with the current panorama configurations.
     */
    _getPanoOptions: function() {
      var panoOptions = {
        pano: this.panoId,
        pov: {
          heading: this.heading,
          pitch: this.pitch
        },
        disableDefaultUI: this.disableDefaultUi,
        zoom: this.zoom
      };

      return panoOptions;
    },

    /**
     * Fired every rAF. Updates the heading to create a slow pan effect
     * Will be canceled by mouse enter or calling stop()
     */
    update: function() {
      this.rAFid = requestAnimationFrame(this.update.bind(this));
      var pov = this.pano.getPov();
      pov.heading += 0.03;
      this.pano.setPov(pov);
    },

    _autoUpdate: function() {
      if (this.disableAutoPan) {
        return;
      }

      this.update();
    },

    /**
     * Reset the pov for the panorama.
     * @method reset
     */
    reset: function() {
      var pov = this.pano.getPov();
      pov.heading = this.heading;
      pov.pitch = this.pitch;
      this.pano.setPov(pov);
    },

    /**
     * Cancel the slow panning animation.
     * @method stop
     */
    stop: function() {
      cancelAnimationFrame(this.rAFid);
    },

    _autoStop: function() {
      if (this.disableAutoPan) {
        return;
      }

      this.stop();
    },

    _panoIdChanged: function(newVal, oldVal) {
      if (this.pano) {
        this.pano.setPano(newVal);
        this.reset();
      }
    }
  });
