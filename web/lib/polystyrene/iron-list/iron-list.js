

(function() {

  var IOS = navigator.userAgent.match(/iP(?:hone|ad;(?: U;)? CPU) OS (\d+)/);
  var IOS_TOUCH_SCROLLING = IOS && IOS[1] >= 8;
  var DEFAULT_PHYSICAL_COUNT = 20;

  Polymer({

    is: 'iron-list',

    properties: {

      /**
       * An array containing items determining how many instances of the template
       * to stamp and that that each template instance should bind to.
       */
      items: {
        type: Array
      },

      /**
       * The name of the variable to add to the binding scope for the array
       * element associated with a given template instance.
       */
      as: {
        type: String,
        value: 'item'
      },

      /**
       * The name of the variable to add to the binding scope with the index
       * for the row.  If `sort` is provided, the index will reflect the
       * sorted order (rather than the original array order).
       */
      indexAs: {
        type: String,
        value: 'index'
      }

    },

    observers: [
      '_itemsChanged(items.*)'
    ],

    behaviors: [
      Polymer.Templatizer,
      Polymer.IronResizableBehavior
    ],

    listeners: {
      'iron-resize': '_resizeHandler'
    },

    /**
     * The ratio of hidden tiles that should remain in the scroll direction.
     * Recommended value ≈ 0.5, so it will distribute tiles evely in both directions.
     */
    _ratio: 0.5,

    /**
     * The element that controls the scroll
     */
    _scroller: null,

    /**
     * The padding-top value of the `scroller` element
     */
    _scrollerPaddingTop: 0,

    /**
     * This value is the same as `scrollTop`.
     */
    _scrollPosition: 0,

    /**
     * The number of tiles in the DOM.
     */
    _physicalCount: DEFAULT_PHYSICAL_COUNT,

    /**
     * The k-th tile that is at the top of the scrolling list.
     */
    _physicalStart: 0,

    /**
     * The k-th tile that is at the bottom of the scrolling list.
     */
    _physicalEnd: 0,

    /**
     * The sum of the heights of all the tiles in the DOM.
     */
    _physicalSize: 0,

    /**
     * The average `offsetHeight` of the tiles observed till now.
     */
    _physicalAverage: 0,

    /**
     * The number of tiles which `offsetHeight` > 0 observed until now.
     */
    _physicalAverageCount: 0,

    /**
     * The Y position of the item rendered in the `_physicalStart`
     * tile relative to the scrolling list.
     */
    _physicalTop: 0,

    /**
     * The number of items in the list.
     */
    _virtualCount: 0,

    /**
     * The n-th item rendered in the `_physicalStart` tile.
     */
    _virtualStartVal: 0,

    /**
     * A map between an item key and its physical item index
     */
    _physicalIndexForKey: {},

    /**
     * The average scroll size
     */
    _scrollSize: 0,

    /**
     * The size of the viewport
     */
    _viewportSize: 0,

    /**
     * An array of DOM nodes that are currently in the tree
     */
    _physicalItems: null,

    /**
     * An array of heights for each item in `_physicalItems`
     */
    _physicalSizes: null,

    /**
     * A cached value for the visible index.
     * See `firstVisibleIndex`
     */
    _firstVisibleIndexVal: null,

    /**
     * A Polymer collection for the items.
     */
    _collection: null,

    get _physicalBottom() {
      return this._physicalTop + this._physicalSize;
    },

    get _scrollBottom() {
      return this._scrollPosition + this._viewportSize - this._scrollerPaddingTop;
    },

    get _virtualEnd() {
      return this._virtualStartVal + this._physicalCount - 1;
    },

    get _maxVirtualStart() {
      return this._virtualCount < this._physicalCount ?
          this._virtualCount : this._virtualCount - this._physicalCount;
    },

    get _hiddenContentSize() {
      return this._physicalSize - this._viewportSize;
    },

    get _minVirtualStart() {
      return 0;
    },

    get _maxScrollTop() {
      return this._scrollSize - this._viewportSize;
    },

    set _virtualStart(val) {
      this._virtualStartVal = Math.min(this._maxVirtualStart, Math.max(this._minVirtualStart, val));
      this._physicalStart = this._virtualStartVal % this._physicalCount;
      this._physicalEnd = (this._physicalStart + this._physicalCount - 1) % this._physicalCount;
    },

    get _virtualStart() {
      return this._virtualStartVal;
    },

    /**
     * Gets the first visible item in the viewport.
     *
     * @property firstVisibleIndex
     */
    get firstVisibleIndex() {
      var physicalOffset;

      if (this._firstVisibleIndexVal === null || 1) {
        physicalOffset = this._physicalTop;

        this._firstVisibleIndexVal = this._iterateItems(
          function(pidx, vidx) {
            physicalOffset += this._physicalSizes[pidx];

            if (physicalOffset > this._scrollPosition) {
              return vidx;
            }
          }) || 0;
      }

      return this._firstVisibleIndexVal;
    },

    attached: function() {
      // delegate to the parent's scroller
      // e.g. paper-scroll-header-panel
      var el = Polymer.dom(this);

      if (el.parentNode && el.parentNode.scroller) {
        this._scroller = el.parentNode.scroller;
        this.updateViewportBoundaries();
      } else {
        this._scroller = this;
        this.classList.add('has-scroller');
      }

      if (IOS_TOUCH_SCROLLING) {
        this._scroller.style.webkitOverflowScrolling = 'touch';

        this._scroller.addEventListener('scroll', function() {
          requestAnimationFrame(this._scrollHandler.bind(this));
        }.bind(this));
      } else {
        this._scroller.addEventListener('scroll', this._scrollHandler.bind(this));
      }
    },

    /**
     * Invoke this method if you dynamically update the viewport's
     * size or CSS padding.
     *
     * @method updateViewportBoundaries
     */
    updateViewportBoundaries: function() {
      var scrollerStyle = window.getComputedStyle(this._scroller);
      this._scrollerPaddingTop = parseInt(scrollerStyle['padding-top']);
      this._viewportSize = this._scroller.offsetHeight;
    },

    /**
     * Update the models, the position of the
     * items in the viewport and recycle tiles as needed.
     */
    _refresh: function() {
      var SCROLL_DIRECTION_UP = -1;
      var SCROLL_DIRECTION_DOWN = 1;
      var SCROLL_DIRECTION_NONE = 0;

      // clamp the `scrollTop` value
      // IE 10|11 scrollTop may go above `_maxScrollTop`
      // iOS `scrollTop` may go below 0 and above `_maxScrollTop`
      var scrollTop = Math.max(0, Math.min(this._maxScrollTop, this._scroller.scrollTop));

      var tileHeight, kth, recycledTileSet;
      var ratio = this._ratio;
      var delta = scrollTop - this._scrollPosition;
      var direction = SCROLL_DIRECTION_NONE;
      var recycledTiles = 0;
      var hiddenContentSize = this._hiddenContentSize;
      var currentRatio = ratio;
      var movingUp = [];

      // track the last `scrollTop`
      this._scrollPosition = scrollTop;

      // clear cached visible index
      this._firstVisibleIndexVal = null;

      // random access
      if (this._scrollBottom > this._physicalBottom || scrollTop < this._physicalTop) {
        this._physicalTop += delta;
        direction = SCROLL_DIRECTION_NONE;
        recycledTiles =  Math.round(delta / this._physicalAverage);
      }
      // scroll up
      else if (delta < 0) {
        var topSpace = scrollTop - this._physicalTop;
        var virtualStart = this._virtualStart;

        direction = SCROLL_DIRECTION_UP;
        recycledTileSet = [];

        kth = this._physicalEnd;
        currentRatio = topSpace / hiddenContentSize;

        // move tiles from bottom to top
        while (
            // approximate `currentRatio` to `ratio`
            currentRatio < ratio &&
            // recycle less physical items than the total
            recycledTiles < this._physicalCount &&
            // ensure that these recycled tiles are needed
            virtualStart - recycledTiles > 0
        ) {

          tileHeight = this._physicalSizes[kth] || this._physicalAverage;
          currentRatio += tileHeight / hiddenContentSize;

          recycledTileSet.push(kth);
          recycledTiles++;
          kth = (kth === 0) ? this._physicalCount - 1 : kth - 1;
        }

        movingUp = recycledTileSet;
        recycledTiles = -recycledTiles;

      }
      // scroll down
      else if (delta > 0) {
        var bottomSpace = this._physicalBottom - (scrollTop + this._viewportSize);
        var virtualEnd = this._virtualEnd;
        var lastVirtualItemIndex = this._virtualCount-1;

        direction = SCROLL_DIRECTION_DOWN;
        recycledTileSet = [];

        kth = this._physicalStart;
        currentRatio = bottomSpace / hiddenContentSize;

        // move tiles from top to bottom
        while (
            // approximate `currentRatio` to `ratio`
            currentRatio < ratio &&
            // recycle less physical items than the total
            recycledTiles < this._physicalCount &&
            // ensure that these recycled tiles are needed
            virtualEnd + recycledTiles < lastVirtualItemIndex
          ) {

          tileHeight = this._physicalSizes[kth] || this._physicalAverage;
          currentRatio += tileHeight / hiddenContentSize;

          this._physicalTop += tileHeight;
          recycledTileSet.push(kth);
          recycledTiles++;
          kth = (kth + 1) % this._physicalCount;
        }
      }

      if (recycledTiles !== 0) {
        this._virtualStart = this._virtualStart + recycledTiles;
        this._update(recycledTileSet, movingUp);
      }
    },

    _update: function(recycledTileSet, movingUp) {
      // update models
      this._assignModels(recycledTileSet);

      // measure heights
      // TODO(blasten) pass `recycledTileSet`
      this._updateMetrics();

      // adjust offset after measuring
      if (movingUp) {
        while (movingUp.length) {
          this._physicalTop -= this._physicalSizes[movingUp.pop()];
        }
      }

     // update the position of the items
      this._positionItems();

      // set the scroller size
      this._updateScrollerSize();
    },

    _refreshAll: function() {
      // polymer/issues/2039
      CustomElements.takeRecords();
      this._update();
    },

    _ensureTemplatized: function() {
      if (!this.ctor) {
        // Template instance props that should be excluded from forwarding
        this._instanceProps = {
          __key__: true
        };
        this._instanceProps[this.as] = true;
        this._instanceProps[this.indexAs] = true;
        this._userTemplate = Polymer.dom(this).querySelector('template');
        if (this._userTemplate) {
          this.templatize(this._userTemplate);
        } else {
          console.warn('x-list requires a template to be provided in light-dom');
        }
      }
    },

    /**
     * Implements extension point from Templatizer mixin.
     */
    _getStampedChildren: function() {
      return this._physicalItems;
    },

    /**
     * Implements extension point from Templatizer
     * Called as a side effect of a template instance path change, responsible
     * for notifying items.<key-for-instance>.<path> change up to host.
     */
    _forwardInstancePath: function(inst, path, value) {
      if (path.indexOf(this.as + '.') === 0) {
        this.notifyPath('items.' + inst.__key__ + '.' +
          path.slice(this.as.length + 1), value);
      }
    },

    /**
     * Implements extension point from Templatizer mixin
     * Called as side-effect of a host property change, responsible for
     * notifying parent path change on each row.
     */
    _forwardParentProp: function(prop, value) {
      if (this._physicalItems) {
        this._physicalItems.forEach(function(item) {
          item._templateInstance[prop] = value;
        }, this);
      }
    },

    /**
     * Implements extension point from Templatizer
     * Called as side-effect of a host path change, responsible for
     * notifying parent.<path> path change on each row.
     */
    _forwardParentPath: function(path, value) {
      if (this._physicalItems) {
        this._physicalItems.forEach(function(item) {
          item._templateInstance.notifyPath(path, value, true);
        }, this);
      }
    },

    /**
     * Called as a side effect of a host items.<key>.<path> path change,
     * responsible for notifying item.<path> changes to row for key.
     */
    _forwardItemPath: function(path, value) {
      if (this._physicalIndexForKey) {
        var dot = path.indexOf('.');
        var key = path.substring(0, dot < 0 ? path.length : dot);
        var idx = this._physicalIndexForKey[key];
        var row = this._physicalItems[idx];
        if (row) {
          var inst = row._templateInstance;
          if (dot >= 0) {
            path = this.as + '.' + path.substring(dot+1);
            inst.notifyPath(path, value, true);
          } else {
            inst[this.as] = value;
          }
        }
      }
    },

    _itemsChanged: function(change) {
      if (change.path === 'items') {
        // update the whole set
        this._virtualStartVal = 0;
        this._physicalTop = 0;
        this._virtualCount = this.items ? this.items.length : 0;

        this._collection = Polymer.Collection.get(this.items);
        this._physicalItems = this._physicalItems || new Array(this._physicalCount);
        this._physicalSizes = this._physicalSizes || new Array(this._physicalCount);

        this._ensureTemplatized();

        for (var i = 0; i < this._physicalCount; i++) {
          if (!this._physicalItems[i]) {
            var inst = this.stamp(this.items[i]);

            // First element child is item; Safari doesn't support children[0]
            // on a doc fragment
            this._physicalItems[i] = inst.root.querySelector('*');
            Polymer.dom(this).appendChild(inst.root);
          }
        }

        this.debounce('refresh', this._refreshAll);

      } else if (change.path === 'items.splices') {

        this._adjustVirtualIndex(change.value.indexSplices);
        this._virtualCount = this.items ? this.items.length : 0;

        this.debounce('refresh', this._refreshAll);

      } else {
        // update a single item
        this._forwardItemPath(change.path.split('.').slice(1).join('.'), change.value);
      }
    },

    _adjustVirtualIndex: function(splices) {
      for (var i = 0; i < splices.length; i++) {
        var splice = splices[i];
        var idx = splice.index;
        // We only need to care about changes happening above the current position
        if (idx >= this._virtualStartVal) {
          break;
        }

        this._virtualStart = this._virtualStart +
            Math.max(splice.addedCount - splice.removed.length, idx - this._virtualStartVal);
      }
    },

    _scrollHandler: function() {
      this._refresh();
    },

    _iterateItems: function(fn, itemSet) {
      var pidx, vidx, rtn, i;

      if (arguments.length === 2 && itemSet) {
        for (i = 0; i < itemSet.length; i++) {
          pidx = itemSet[i];
          if (pidx >= this._physicalStart) {
            vidx = this._virtualStartVal + (pidx - this._physicalStart);
          } else {
            vidx = this._virtualStartVal + (this._physicalCount - this._physicalStart) + pidx;
          }
          if ((rtn = fn.call(this, pidx, vidx)) != null) {
            return rtn;
          }
        }
      } else {
        pidx = this._physicalStart;
        vidx = this._virtualStartVal;

        for (; pidx < this._physicalCount; pidx++, vidx++) {
          if ((rtn = fn.call(this, pidx, vidx)) != null) {
            return rtn;
          }
        }

        pidx = 0;

        for (; pidx < this._physicalStart; pidx++, vidx++) {
          if ((rtn = fn.call(this, pidx, vidx)) != null) {
            return rtn;
          }
        }
      }
    },

    _assignModels: function(itemSet) {
      this._iterateItems(function(pidx, vidx) {
        var el = this._physicalItems[pidx];
        var inst = el._templateInstance;
        var item = this.items && this.items[vidx];

        if (item) {
          inst[this.as] = item;
          inst.__key__ = this._collection.getKey(item);
          inst[this.indexAs] = vidx;
          el.removeAttribute('hidden');
          this._physicalIndexForKey[inst.__key__] = pidx;
        } else {
          inst.__key__ = null;
          el.setAttribute('hidden', '');
        }

      }, itemSet);
    },

    _updateMetrics: function() {
      var total = 0;
      var prevAvgCount = this._physicalAverageCount;
      var prevPhysicalAvg = this._physicalAverage;

      for (var i = 0; i < this._physicalCount; i++) {
        this._physicalSizes[i] = this._physicalItems[i].offsetHeight;
        total += this._physicalSizes[i];
        this._physicalAverageCount += this._physicalSizes[i] ? 1 : 0;
      }

      this._physicalSize = total;
      this._viewportSize = this._scroller.offsetHeight;

      if (this._physicalAverageCount !== prevAvgCount) {
        this._physicalAverage = Math.round(
            ((prevPhysicalAvg * prevAvgCount) + total) /
            this._physicalAverageCount);
      }
    },

    _positionItems: function(itemSet) {
      this._adjustScrollPosition();

      var y = this._physicalTop;

      this._iterateItems(function(pidx) {

        this.transform('translate3d(0, ' + y + 'px, 0)', this._physicalItems[pidx]);
        y += this._physicalSizes[pidx];

      }, itemSet);
    },

    _adjustScrollPosition: function() {
      var deltaHeight = this._virtualStartVal === 0 ? this._physicalTop :
          Math.min(this._scrollPosition + this._physicalTop, 0);

      if (deltaHeight) {
        this._physicalTop = this._physicalTop - deltaHeight;

        // juking scroll position during interial scrolling on iOS is no bueno
        if (!IOS_TOUCH_SCROLLING) {
          this._resetScrollPosition(this._scroller.scrollTop - deltaHeight);
        }
      }
    },

    _resetScrollPosition: function(pos) {
      this._scroller.scrollTop = pos;
      this._scrollPosition = this._scroller.scrollTop;
    },

    _updateScrollerSize: function() {
      this._scrollSize = (this._physicalBottom +
          Math.max(this._virtualCount - this._physicalCount - this._virtualStartVal, 0) * this._physicalAverage);

      this.$.items.style.height = this._scrollSize + 'px';
    },

    /**
     * Scroll to a specific item in the virtual list regardless
     * of the physical items in the DOM tree.
     *
     * @method scrollToIndex
     */
    scrollToIndex: function(idx) {
      if (typeof idx !== 'number') {
        return;
      }

      var firstVisible = this.firstVisibleIndex;

      idx = Math.min(Math.max(idx, 0), this._virtualCount-1);

      // start at the previous virtual item
      // so we have a item above the first visible item
      this._virtualStart = idx - 1;

      // assign new models
      this._assignModels();

      // measure the new sizes
      this._updateMetrics();

      // estimate new physical offset
      this._physicalTop = this._virtualStart * this._physicalAverage;

      var currentTopItem = this._physicalStart;
      var currentVirtualItem = this._virtualStart;
      var targetOffsetTop = 0;
      var hiddenContentSize = this._hiddenContentSize;

      // scroll to the item as much as we can
      while (currentVirtualItem !== idx && targetOffsetTop < hiddenContentSize) {
        targetOffsetTop = targetOffsetTop + this._physicalSizes[currentTopItem];
        currentTopItem = (currentTopItem + 1) % this._physicalCount;
        currentVirtualItem++;
      }

      // update the scroller size
      this._updateScrollerSize();

      // update the position of the items
      this._positionItems();

      // set the new scroll position
      this._resetScrollPosition(this._physicalTop + targetOffsetTop + 1);

      // clear cached visible index
      this._firstVisibleIndexVal = null;
    },

    _resetAverage: function() {
      this._physicalAverage = 0;
      this._physicalAverageCount = 0;
    },

    _resizeHandler: function() {
      if (this._physicalItems) {
        this.debounce('resize', function() {
          this._resetAverage();
          this.updateViewportBoundaries();
          this.scrollToIndex(this.firstVisibleIndex);
        });
      }
    }
  });

})();

