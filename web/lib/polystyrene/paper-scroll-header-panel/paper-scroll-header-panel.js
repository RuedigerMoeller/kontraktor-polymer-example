
(function() {

  'use strict';

  Polymer({

    /**
     * Fired when the content has been scrolled.
     *
     * @event content-scroll
     */

    /**
     * Fired when the header is transformed.
     *
     * @event paper-header-transform
     */

    is: 'paper-scroll-header-panel',

    behaviors: [
      Polymer.IronResizableBehavior
    ],

    properties: {

      /**
       * If true, the header's height will condense to `condensedHeaderHeight`
       * as the user scrolls down from the top of the content area.
       */
      condenses: {
        type: Boolean,
        value: false
      },

      /**
       * If true, no cross-fade transition from one background to another.
       */
      noDissolve: {
        type: Boolean,
        value: false
      },

      /**
       * If true, the header doesn't slide back in when scrolling back up.
       */
      noReveal: {
        type: Boolean,
        value: false
      },

      /**
       * If true, the header is fixed to the top and never moves away.
       */
      fixed: {
        type: Boolean,
        value: false
      },

      /**
       * If true, the condensed header is always shown and does not move away.
       */
      keepCondensedHeader: {
        type: Boolean,
        value: false
      },

      /**
       * The height of the header when it is at its full size.
       *
       * By default, the height will be measured when it is ready.  If the height
       * changes later the user needs to either set this value to reflect the
       * new height or invoke `measureHeaderHeight()`.
       */
      headerHeight: {
        type: Number,
        value: 0
      },

      /**
       * The height of the header when it is condensed.
       *
       * By default, `condensedHeaderHeight` is 1/3 of `headerHeight` unless
       * this is specified.
       */
      condensedHeaderHeight: {
        type: Number,
        value: 0
      },

      /**
       * By default, the top part of the header stays when the header is being
       * condensed.  Set this to true if you want the top part of the header
       * to be scrolled away.
       */
      scrollAwayTopbar: {
        type: Boolean,
        value: false
      },

      /**
       * The state of the header. The initial value is `HEADER_STATE_EXPANDED`.
       * Depending on the configuration and the `scrollTop` value,
       * the header state could change to
       * `HEADER_STATE_HIDDEN`, `HEADER_STATE_CONDENSED` and `HEADER_STATE_INTERPOLATED`
       */
      headerState: {
        type: Number,
        readOnly: true,
        value: 0
      },

      _prevScrollTop: {
        type: Number,
        value: 0
      },

      _y: {
        type: Number,
        value: 0
      },

      /** @type {number|null} */
      _defaultCondsensedHeaderHeight: {
        type: Number,
        value: 0
      }
    },

    observers: [
      '_setup(headerHeight, condensedHeaderHeight, fixed)',
      '_condensedHeaderHeightChanged(condensedHeaderHeight)',
      '_headerHeightChanged(headerHeight, condensedHeaderHeight)',
      '_condensesChanged(condenses)',
    ],

    listeners: {
      'iron-resize': 'measureHeaderHeight'
    },

    ready: function() {
      this.async(this.measureHeaderHeight, 5);
      this._scrollHandler = this._scroll.bind(this);
      this.scroller.addEventListener('scroll', this._scrollHandler);
    },

    /**
     * The header's initial state
     *
     * @property HEADER_STATE_EXPANDED
     * @type number
     */
    HEADER_STATE_EXPANDED: 0,

    /**
     * The header's state when it's hidden.
     *
     * @property HEADER_STATE_HIDDEN
     * @type number
     */
    HEADER_STATE_HIDDEN: 1,

    /**
     * The header's state when it's condensed.
     *
     * @property HEADER_STATE_CONDENSED
     * @type number
     */
    HEADER_STATE_CONDENSED: 2,

    /**
     * The header's state when its progress is somewhere between
     * the `hidden` and `condensed` state.
     *
     * @property HEADER_STATE_INTERPOLATED
     * @type number
     */
    HEADER_STATE_INTERPOLATED: 3,

    /**
     * Returns the header element.
     *
     * @property header
     * @type Object
     */
    get header() {
      return Polymer.dom(this.$.headerContent).getDistributedNodes()[0];
    },

    /**
     * Returns the content element.
     *
     * @property content
     * @type Object
     */
    get content() {
      return Polymer.dom(this.$.mainContent).getDistributedNodes()[0];
    },

    /**
     * Returns the scrollable element.
     *
     * @property scroller
     * @type Object
     */
    get scroller() {
      return this.$.mainContainer;
    },

    get _headerMaxDelta() {
      return this.keepCondensedHeader ? this._headerMargin : this.headerHeight;
    },

    get _headerMargin() {
      return this.headerHeight - this.condensedHeaderHeight;
    },

    /**
     * Invoke this to tell `paper-scroll-header-panel` to re-measure the header's
     * height.
     *
     * @method measureHeaderHeight
     */
    measureHeaderHeight: function() {
      var header = this.header;
      if (header && header.offsetHeight) {
        this.headerHeight = header.offsetHeight;
      }
    },

    _headerHeightChanged: function(headerHeight) {
      if (this._defaultCondsensedHeaderHeight !== null) {
        this._defaultCondsensedHeaderHeight = headerHeight * 1/3;
        this.condensedHeaderHeight = this._defaultCondsensedHeaderHeight;
      }
    },

    _condensedHeaderHeightChanged: function(condensedHeaderHeight) {
      if (condensedHeaderHeight) {
        // a user custom value
        if (this._defaultCondsensedHeaderHeight != condensedHeaderHeight) {
          // disable the default value
          this._defaultCondsensedHeaderHeight = null;
        }
      }
    },

    _condensesChanged: function() {
      if (this.condenses) {
        this._scroll();
      } else {
        // reset transform/opacity set on the header
        this._condenseHeader(null);
      }
    },

    _setup: function() {
      var s = this.scroller.style;

      s.paddingTop = this.fixed ? '' : this.headerHeight + 'px';
      s.top = this.fixed ? this.headerHeight + 'px' : '';

      if (this.fixed) {
        this._setHeaderState(this.HEADER_STATE_EXPANDED);
        this._transformHeader(null);
      } else {
        switch (this.headerState) {
          case this.HEADER_STATE_HIDDEN:
            this._transformHeader(this._headerMaxDelta);
            break;
          case this.HEADER_STATE_CONDENSED:
            this._transformHeader(this._headerMargin);
            break;
        }
      }
    },

    _transformHeader: function(y) {
      this._translateY(this.$.headerContainer, -y);

      if (this.condenses) {
        this._condenseHeader(y);
      }

      this.fire('paper-header-transform',
        { y: y,
          height: this.headerHeight,
          condensedHeight: this.condensedHeaderHeight
        }
      );
    },

    _condenseHeader: function(y) {
      var reset = (y === null);

      // adjust top bar in paper-header so the top bar stays at the top
      if (!this.scrollAwayTopbar && this.header && this.header.$ && this.header.$.topBar) {
        this._translateY(this.header.$.topBar,
            reset ? null : Math.min(y, this._headerMargin));
      }
      // transition header bg
      if (!this.noDissolve) {
        this.$.headerBg.style.opacity = reset ? '' :
            ( (this._headerMargin - y) / this._headerMargin);
      }
      // adjust header bg so it stays at the center
      this._translateY(this.$.headerBg, reset ? null : y / 2);
      // transition condensed header bg
      if (!this.noDissolve) {
        this.$.condensedHeaderBg.style.opacity = reset ? '' :
            (y / this._headerMargin);

        // adjust condensed header bg so it stays at the center
        this._translateY(this.$.condensedHeaderBg, reset ? null : y / 2);
      }
    },

    _translateY: function(node, y) {
      this.transform((y === null) ? '' : 'translate3d(0, ' + y + 'px, 0)', node);
    },

    /** @param {Event=} event */
    _scroll: function(event) {
      if (!this.header) {
        return;
      }

      this._y = this._y || 0;
      this._prevScrollTop = this._prevScrollTop || 0;

      var sTop = this.scroller.scrollTop;

      var deltaScrollTop = sTop - this._prevScrollTop;
      var y = Math.max(0, (this.noReveal) ? sTop : this._y + deltaScrollTop);

      if (y > this._headerMaxDelta) {
        y = this._headerMaxDelta;
        this._setHeaderState(this.HEADER_STATE_HIDDEN);

      } else if (this.condenses && this._prevScrollTop >= sTop && sTop > this._headerMargin) {
        y = Math.max(y, this._headerMargin);
        this._setHeaderState(this.HEADER_STATE_CONDENSED);

      } else if (y === 0) {
        this._setHeaderState(this.HEADER_STATE_EXPANDED);

      } else {
        this._setHeaderState(this.HEADER_STATE_INTERPOLATED);

      }

      if (!event || !this.fixed && y !== this._y) {
        this._transformHeader(y);
      }

      this._prevScrollTop = Math.max(sTop, 0);
      this._y = y;

      if (event) {
        this.fire('content-scroll', {target: this.scroller}, {cancelable: false});
      }
    }

  });

})();

