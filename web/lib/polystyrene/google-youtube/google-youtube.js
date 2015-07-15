
  Polymer({
    is: 'google-youtube',
    /**
     * Fired when the YouTube player is fully initialized and ready for use.
     *
     * @event google-youtube-ready
     */

    /**
     * Fired when the state of the player changes. `e.detail.data` is set to one of
     * [the documented](https://developers.google.com/youtube/iframe_api_reference#onStateChange)
     * states.
     *
     * @event google-youtube-state-change
     * @param {Object} e Event parameters.
     */

    /**
     * Fired when playback fails due to an error. `e.detail.data` is set to one of
     * [the documented](https://developers.google.com/youtube/iframe_api_reference#onError)
     * error codes.
     *
     * @event google-youtube-error
     * @param {Object} e Event parameters.
     */

     properties: {
    /**
     * Sets the id of the video to play. Changing this attribute will trigger a call
     * to load a new video into the player (if `this.autoplay` is set to `1` and `playsupported` is true)
     * or cue a new video otherwise.
     *
     * You can [search for videos programmatically](https://developers.google.com/youtube/v3/docs/search/list)
     * using the YouTube Data API, or just hardcode known video ids to display on your page.
     */
      videoId: {
        type: String,
        value: 'mN7IAaRdi_k',
        observer: '_videoIdChanged'
      },

      /**
       * Whether programmatic `<video>.play()` for initial playback is supported in the current browser.
       *
       * Most mobile browsers [do not support](https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html#//apple_ref/doc/uid/TP40009523-CH5-SW1) autoplaying or scripted playback of videos.
       * If you attempt to automatically initiate playback of a `<google-youtube>`, e.g. by calling the `play()` method before
       * playback has initially begun, the YouTube Player will enter an unrecoverable "stuck" state.
       * To protect against this, check the value of `playsupported` and don't call `play()` if it is set to `false`.
       * (You can hide/disable your custom play button, etc.)
       *
       * The `playsupported` value is determined at runtime, by dynamically creating a `<video>` element with an
       * inlined data source and calling `play()` on it. (Inspired by [Modernizr](https://github.com/Modernizr/Modernizr/blob/master/feature-detects/video/autoplay.js).)
       *
       * If you would rather not incur the minimal overhead involved in going through this process, you can explicitly set
       * `playsupported` to `true` or `false` when initializing `<google-youtube>`. This is only recommended if you know that
       * your web app will never (or only) be used on mobile browsers.
       */
      playsupported: {
        type: Boolean,
        value: null,
        notify: true
      },

      /**
       * "1" if video should start automatically
       */
      autoplay: {
        type: Number,
        value: 0
      },
      /**
       * Whether playback has started.
       *
       * This defaults to `false` and is set to `true` once the first 'playing' event is fired by
       * the underlying YouTube Player API.
       *
       * Once set to `true`, it will remain that way indefinitely.
       * Paused/buffering/ended events won't cause `playbackstarted` to reset to `false`.
       * Nor will loading a new video into the player.
       */
      playbackstarted: {
        type: Boolean,
        value: false,
        notify: true
      },

      /**
       * Sets the height of the player on the page.
       * Accepts anything valid for a CSS measurement, e.g. '200px' or '50%'.
       * If the unit of measurement is left off, 'px' is assumed.
       */
      height: {
        type: String,
        value: '270px'
      },

      /**
       * Sets the width of the player on the page.
       * Accepts anything valid for a CSS measurement, e.g. '200px' or '50%'.
       * If the unit of measurement is left off, 'px' is assumed.
       */
      width: {
        type: String,
        value:'480px'
      },

      /**
       * Exposes the current player state.
       * Using this attribute is an alternative to listening to `google-youtube-state-change` events,
       * and can simplify the logic in templates with conditional binding.
       *
       * The [possible values](https://developers.google.com/youtube/iframe_api_reference#onStateChange):
       *   - -1 (unstarted)
       *   - 0 (ended)
       *   - 1 (playing)
       *   - 2 (paused)
       *   - 3 (buffering)
       *   - 5 (video cued)
       */
      state: {
        type: Number,
        value: -1,
        notify: true
      },

      /**
       * Exposes the current playback time, in seconds.
       *
       * You can divide this value by the `duration` to determine the playback percentage.
       */
      currenttime: {
        type: Number,
        value: 0,
        notify: true
      },

      /**
       * Exposes the video duration, in seconds.
       *
       * You can divide the `currenttime` to determine the playback percentage.
       *
       * @attribute duration
       * @type number
       */
      duration: {
        type: Number,
        value: 1, // To avoid divide-by-zero errors if used before video is cued.
        notify: true
      },

      /**
       * Exposes the current playback time, formatted as a (HH:)MM:SS string.
       */
      currenttimeformatted: {
        type: String,
        value: '0:00',
        notify: true
      },

      /**
       * Exposes the video duration, formatted as a (HH:)MM:SS string.
       */
      durationformatted: {
        type: String,
        value: '0:00', // To avoid divide-by-zero errors if used before video is cued.
        notify: true
      },

      /**
       * The fraction of the bytes that have been loaded for the current video, in the range [0-1].
       */
      fractionloaded: {
        type: Number,
        value: 0,
        notify: true
      },

      /**
       * A shorthand to enable a set of player attributes that, used together, simulate a "chromeless" YouTube player.
       *
       * Equivalent to setting the following attributes:
       * - `controls="0"`
       * - `modestbranding="1"`
       * - `showinfo="0"`
       * - `iv_load_policy="3"`
       * - `rel="0"`
       *
       * The "chromeless" player has minimal YouTube branding in cued state, and the native controls
       * will be disabled during playback. Creating your own custom play/pause/etc. controls is recommended.
       */
      chromeless: {
        type: Boolean,
        value: false
      },
      /**
       * The URL of an image to use as a custom thumbnail.
       *
       * This is optional; if not provided, the standard YouTube embed (which uses the thumbnail associated
       * with the video on YouTube) will be used.
       *
       * If `thumbnail` is set, than an `<img>` containing the thumbnail will be used in lieu of the actual
       * YouTube embed. When the thumbnail is clicked, the `<img>` is swapped out for the actual YouTube embed,
       * which will have [`autoplay=1`](https://developers.google.com/youtube/player_parameters#autoplay) set by default (in additional to any other player parameters specified on this element).
       *
       * Please note that `autoplay=1` won't actually autoplay videos on mobile browsers, so two taps will be required
       * to play the video there. Also, on desktop browsers, setting `autoplay=1` will prevent the playback
       * from [incrementing the view count](https://support.google.com/youtube/answer/1714329) for the video.
       */
      thumbnail: {
        type: String,
        value: ''
      },

      /**
       * If `fluid` is set, then the player will set its width to 100% to fill
       * the parent container, while adding `padding-top` to preserve the
       * aspect ratio provided by `width` and `height`. If `width` and `height`
       * have not been set, the player will fall back to a 16:9 aspect ratio.
       * This is useful for responsive designs where you don't want to
       * introduce letterboxing on your video.
       */
      fluid: {
        type: Boolean,
        value: false
      }

    },

    _computeContainerStyle: function(width, height) {
      return 'width:' + width + '; height:' + height;
    },

    _useExistingPlaySupportedValue: function() {
      this.playsupported = this._playsupportedLocalStorage;
    },

    /**
     * Detects whether programmatic <video>.play() is supported in the current browser.
     *
     * This is triggered via on-ironlocalstorage-load-empty. The logic is:
     * - If playsupported is explicitly set to true or false on the element, use that.
     * - Otherwise, if there's a cached value in localStorage, use that.
     * - Otherwise, create a hidden <video> element and call play() on it:
     *   - If playback starts, playsupported is true.
     *   - If playback doesn't start (within 500ms), playsupported is false.
     *   - Whatever happens, cache the result in localStorage.
     */
    _determinePlaySupported: function() {
      // If playsupported isn't already being overridden by the page using this component, then attempt
      // to determine if it's supported.
      // This is deliberately checking with ==, to match either undefined or null.
      if (this.playsupported == null) {
        // Run a new playback test.
        var timeout;
        var videoElement = document.createElement('video');

        if ('play' in videoElement) {
          videoElement.id = 'playtest';

          var mp4Source = document.createElement('source');
          mp4Source.src = "data:video/mp4;base64,AAAAFGZ0eXBNU05WAAACAE1TTlYAAAOUbW9vdgAAAGxtdmhkAAAAAM9ghv7PYIb+AAACWAAACu8AAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAnh0cmFrAAAAXHRraGQAAAAHz2CG/s9ghv4AAAABAAAAAAAACu8AAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAFAAAAA4AAAAAAHgbWRpYQAAACBtZGhkAAAAAM9ghv7PYIb+AAALuAAANq8AAAAAAAAAIWhkbHIAAAAAbWhscnZpZGVBVlMgAAAAAAABAB4AAAABl21pbmYAAAAUdm1oZAAAAAAAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAVdzdGJsAAAAp3N0c2QAAAAAAAAAAQAAAJdhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAFAAOABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAAEmNvbHJuY2xjAAEAAQABAAAAL2F2Y0MBTUAz/+EAGGdNQDOadCk/LgIgAAADACAAAAMA0eMGVAEABGjuPIAAAAAYc3R0cwAAAAAAAAABAAAADgAAA+gAAAAUc3RzcwAAAAAAAAABAAAAAQAAABxzdHNjAAAAAAAAAAEAAAABAAAADgAAAAEAAABMc3RzegAAAAAAAAAAAAAADgAAAE8AAAAOAAAADQAAAA0AAAANAAAADQAAAA0AAAANAAAADQAAAA0AAAANAAAADQAAAA4AAAAOAAAAFHN0Y28AAAAAAAAAAQAAA7AAAAA0dXVpZFVTTVQh0k/Ou4hpXPrJx0AAAAAcTVREVAABABIAAAAKVcQAAAAAAAEAAAAAAAAAqHV1aWRVU01UIdJPzruIaVz6ycdAAAAAkE1URFQABAAMAAAAC1XEAAACHAAeAAAABBXHAAEAQQBWAFMAIABNAGUAZABpAGEAAAAqAAAAASoOAAEAZABlAHQAZQBjAHQAXwBhAHUAdABvAHAAbABhAHkAAAAyAAAAA1XEAAEAMgAwADAANQBtAGUALwAwADcALwAwADYAMAA2ACAAMwA6ADUAOgAwAAABA21kYXQAAAAYZ01AM5p0KT8uAiAAAAMAIAAAAwDR4wZUAAAABGjuPIAAAAAnZYiAIAAR//eBLT+oL1eA2Nlb/edvwWZflzEVLlhlXtJvSAEGRA3ZAAAACkGaAQCyJ/8AFBAAAAAJQZoCATP/AOmBAAAACUGaAwGz/wDpgAAAAAlBmgQCM/8A6YEAAAAJQZoFArP/AOmBAAAACUGaBgMz/wDpgQAAAAlBmgcDs/8A6YEAAAAJQZoIBDP/AOmAAAAACUGaCQSz/wDpgAAAAAlBmgoFM/8A6YEAAAAJQZoLBbP/AOmAAAAACkGaDAYyJ/8AFBAAAAAKQZoNBrIv/4cMeQ==";
          videoElement.appendChild(mp4Source);

          var webmSource = document.createElement('source');
          webmSource.src = "data:video/webm;base64,GkXfo49CgoR3ZWJtQoeBAUKFgQEYU4BnAQAAAAAAF60RTZt0vE27jFOrhBVJqWZTrIIQA027jFOrhBZUrmtTrIIQbE27jFOrhBFNm3RTrIIXmU27jFOrhBxTu2tTrIIWs+xPvwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFUmpZuQq17GDD0JATYCjbGliZWJtbCB2MC43LjcgKyBsaWJtYXRyb3NrYSB2MC44LjFXQY9BVlNNYXRyb3NrYUZpbGVEiYRFnEAARGGIBc2Lz1QNtgBzpJCy3XZ0KNuKNZS4+fDpFxzUFlSua9iu1teBAXPFhL4G+bmDgQG5gQGIgQFVqoEAnIEAbeeBASMxT4Q/gAAAVe6BAIaFVl9WUDiqgQEj44OEE95DVSK1nIN1bmTgkbCBULqBPJqBAFSwgVBUuoE87EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB9DtnVB4eeBAKC4obaBAAAAkAMAnQEqUAA8AABHCIWFiIWEiAICAAamYnoOC6cfJa8f5Zvda4D+/7YOf//nNefQYACgnKGWgQFNANEBAAEQEAAYABhYL/QACIhgAPuC/rOgnKGWgQKbANEBAAEQEAAYABhYL/QACIhgAPuC/rKgnKGWgQPoANEBAAEQEAAYABhYL/QACIhgAPuC/rOgnKGWgQU1ANEBAAEQEAAYABhYL/QACIhgAPuC/rOgnKGWgQaDANEBAAEQEAAYABhYL/QACIhgAPuC/rKgnKGWgQfQANEBAAEQEAAYABhYL/QACIhgAPuC/rOgnKGWgQkdANEBAAEQEBRgAGFgv9AAIiGAAPuC/rOgnKGWgQprANEBAAEQEAAYABhYL/QACIhgAPuC/rKgnKGWgQu4ANEBAAEQEAAYABhYL/QACIhgAPuC/rOgnKGWgQ0FANEBAAEQEAAYABhYL/QACIhgAPuC/rOgnKGWgQ5TANEBAAEQEAAYABhYL/QACIhgAPuC/rKgnKGWgQ+gANEBAAEQEAAYABhYL/QACIhgAPuC/rOgnKGWgRDtANEBAAEQEAAYABhYL/QACIhgAPuC/rOgnKGWgRI7ANEBAAEQEAAYABhYL/QACIhgAPuC/rIcU7trQOC7jLOBALeH94EB8YIUzLuNs4IBTbeH94EB8YIUzLuNs4ICm7eH94EB8YIUzLuNs4ID6LeH94EB8YIUzLuNs4IFNbeH94EB8YIUzLuNs4IGg7eH94EB8YIUzLuNs4IH0LeH94EB8YIUzLuNs4IJHbeH94EB8YIUzLuNs4IKa7eH94EB8YIUzLuNs4ILuLeH94EB8YIUzLuNs4INBbeH94EB8YIUzLuNs4IOU7eH94EB8YIUzLuNs4IPoLeH94EB8YIUzLuNs4IQ7beH94EB8YIUzLuNs4ISO7eH94EB8YIUzBFNm3SPTbuMU6uEH0O2dVOsghTM";
          videoElement.appendChild(webmSource);

          document.body.appendChild(videoElement);

          this.async(function() {
            // Ideally, we'll get a 'playing' event if we're on a browser that supports programmatic play().
            videoElement.onplaying = function(e) {
              clearTimeout(timeout);

              this.playsupported = (e && e.type === 'playing') || videoElement.currentTime !== 0;
              this._playsupportedLocalStorage = this.playsupported;

              videoElement.onplaying = null;

              document.body.removeChild(videoElement);
            }.bind(this);

            // If we haven't received a 'playing' event within 500ms, then we're most likely on a browser that doesn't
            // support programmatic plays. Do a final check after 500ms and set this.playsupported at that point.
            timeout = setTimeout(videoElement.onplaying, 500);

            // Try to initiate playback...
            videoElement.play();
          });
        } else {
          // If there's no play() method then we know that it's not supported.
          this.playsupported = false;
          this._playsupportedLocalStorage = false;
        }
      }
    },

    /**
     * Sets fluid width/height.
     *
     * If the fluid attribute is set, the aspect ratio of the video will
     * be inferred (if set in pixels), or assumed to be 16:9. The element
     * will give itself enough top padding to force the player to use the
     * correct aspect ratio, even as the screen size changes.
     *
     */
    ready: function() {
      if (this.hasAttribute('fluid')) {
        var ratio = parseInt(this.height, 10) / parseInt(this.width, 10);
        if (isNaN(ratio)) {
          ratio = 9/16;
        }
        ratio *= 100;
        this.width = '100%';
        this.height = 'auto';
        this.style['padding-top'] = ratio + '%';
      }
    },

    /**
     * Clean up the underlying Player `<iframe>` when we're removed from the DOM.
     */
    detached: function() {
      if (this._player) {
        this._player.destroy();
      }
    },

    /**
     * Plays the current video.
     *
     * Note that on certain mobile browsers, playback
     * [can't be initiated programmatically](https://developers.google.com/youtube/iframe_api_reference#Mobile_considerations).
     *
     * If `this.playsupported` is not `true`, calling `play()` will have no effect.
     *
     * @method play
     */
    play: function() {
      if (this._player && this._player.playVideo && this.playsupported) {
        this._player.playVideo();
      }
    },

    /**
     * Modifies the volume of the current video.
     *
     * Developers should take care not to break expected user experience by programmatically
     * modifying the volume on mobile browsers.
     * Note that the YouTube player, in addition, does not display volume controls in a
     * mobile environment.
     *
     * @method setVolume
     * @param {number} volume The new volume, an integer between 0 (muted) and 100 (loudest).
     */
    setVolume: function(volume) {
      if (this._player && this._player.setVolume) {
        this._player.setVolume(volume);
      }
    },

    /**
     * Mutes the current video.
     *
     * Developers should take care not to break expected user experience by programmatically
     * modifying the volume on mobile browsers.
     * Note that the YouTube player, in addition, does not display volume controls in a
     * mobile environment.
     *
     * @method mute
     */
    mute: function() {
      if (this._player && this._player.mute) {
        this._player.mute();
      }
    },

    /**
     * Unmutes the current video.
     *
     * Developers should take care not to break expected user experience by programmatically
     * modifying the volume on mobile browsers.
     * Note that the YouTube player, in addition, does not display volume controls in a
     * mobile environment.
     *
     * @method unMute
     */
    unMute: function() {
      if (this._player && this._player.unMute) {
        this._player.unMute();
      }
    },

    /**
     * Pauses the current video.
     *
     * @method pause
     */
    pause: function() {
      if (this._player && this._player.pauseVideo) {
        this._player.pauseVideo();
      }
    },

    /**
     * Skips ahead (or back) to the specified number of seconds.
     *
     * @method seekTo
     * @param {number} seconds Number of seconds to seek to.
     */
    seekTo: function(seconds) {
      if (this._player && this._player.seekTo) {
        this._player.seekTo(seconds, true);

        // Explicitly call _updatePlaybackStats() to ensure that the new playback info is
        // reflected in the bound attributes.
        // The 100ms delay is somewhat arbitrary, but the YouTube player does need time to
        // update its internal state following the call to player.seekTo().
        this.async(function() {
          this._updatePlaybackStats();
        }, null, 100);
      }
    },

    _videoIdChanged: function() {
      this.currenttime = 0;
      this.currenttimeformatted = this._toHHMMSS(0);
      this.fractionloaded = 0;
      this.duration = 1;
      this.durationformatted = this._toHHMMSS(0);

      if (!this._player || !this._player.cueVideoById) {
        this._pendingVideoId = this.videoId;
      } else {
        // Figure out whether we should cue or load (which will autoplay) the next video.
        if (this.playsupported && this.attributes['autoplay'] && this.attributes['autoplay'].value == '1') {
          this._player.loadVideoById(this.videoId);
        } else {
          this._player.cueVideoById(this.videoId);
        }
      }
    },

    _player: null,
    __updatePlaybackStatsInterval: null,
    _pendingVideoId: '',

    _apiLoad: function() {
      // Establish some defaults. Attributes set on the google-youtube element
      // can override defaults, or specify additional player parameters. See
      // https://developers.google.com/youtube/player_parameters
      var playerVars = {
        playsinline: 1,
        controls: 2,
        autohide: 1,
        // This will (intentionally) be overwritten if this.attributes['autoplay'] is set.
        autoplay: this.autoplay
      };

      if (this.chromeless) {
        playerVars.controls = 0;
        playerVars.modestbranding = 1;
        playerVars.showinfo = 0;
        // Disable annotations.
        playerVars.iv_load_policy = 3;
        // Disable related videos on the end screen.
        playerVars.rel = 0;
      }

      for (var i = 0; i < this.attributes.length; i++) {
        var attribute = this.attributes[i];
        playerVars[attribute.nodeName] = attribute.value;
      }

      this._player = new YT.Player(this.$.player, {
        videoId: this.videoId,
        width: '100%',
        height: '100%',
        playerVars: playerVars,
        events: {
          onReady: function(e) {
            if (this._pendingVideoId && this._pendingVideoId != this.videoId) {
              this._player.cueVideoById(this._pendingVideoId);
              this._pendingVideoId = '';
            }

            this.fire('google-youtube-ready', e);
          }.bind(this),
          onStateChange: function(e) {
            this.state = e.data;

            // The YouTube Player API only exposes playback data about a video once
            // playback has begun.
            if (this.state == 1) {
              this.playbackstarted = true;

              // After playback has begun, play() can always be used to resume playback if the video is paused.
              this.playsupported = true;

              this.duration = this._player.getDuration();
              this.durationformatted = this._toHHMMSS(this.duration);

              if (!this.__updatePlaybackStatsInterval) {
                this.__updatePlaybackStatsInterval = setInterval(this._updatePlaybackStats.bind(this), 1000);
              }
            } else {
              // We only need to update the stats if the video is playing.
              if (this.__updatePlaybackStatsInterval) {
                clearInterval(this.__updatePlaybackStatsInterval);
                this.__updatePlaybackStatsInterval = null;
              }
            }

            this.fire('google-youtube-state-change', e);
          }.bind(this),
          onError: function(e) {
            // Set the player state to 0 ('ended'), since playback will have stopped.
            this.state = 0;

            this.fire('google-youtube-error', e);
          }.bind(this)
        }
      });
    },

    _updatePlaybackStats: function() {
      this.currenttime = Math.round(this._player.getCurrentTime());
      this.currenttimeformatted = this._toHHMMSS(this.currenttime);
      this.fractionloaded = this._player.getVideoLoadedFraction();
    },

    _toHHMMSS: function(totalSeconds) {
      var hours = Math.floor(totalSeconds / 3600);
      totalSeconds -= hours * 3600;
      var minutes = Math.floor(totalSeconds / 60);
      var seconds = Math.round(totalSeconds - (minutes * 60));

      var hourPortion = '';
      if (hours > 0) {
        hourPortion += hours + ':';

        if (minutes < 10) {
          minutes = '0' + minutes;
        }
      }

      if (seconds < 10) {
        seconds = '0' + seconds;
      }

      return hourPortion + minutes + ':' + seconds;
    },

    _handleThumbnailTap: function() {
      this.autoplay = 1;
      this.thumbnail = '';
    }
  });
