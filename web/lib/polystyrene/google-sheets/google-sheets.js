
(function() {
  var SCOPE_ = 'https://spreadsheets.google.com/feeds';

  // Minimal cache for worksheet row data. Shared across instances so subsequent
  // accesses are fast and API calls only happen once.
  var rowDataCache_ = {};

  function generateCacheKey_() {
    return this._worksheetId + '_'+ this.tabId;
  }

  function getLink_(rel, links) {
    for (var i = 0, link; link = links[i]; ++i) {
      if (link.rel === rel) {
        return link;
      }
    }
    return null;
  }

  // Conversion of Worksheet Ids to GIDs and vice versa
  // od4 > 2
  function wid_to_gid_(wid) {
    return parseInt(String(wid), 36) ^ 31578;
  }
  // 2 > 0d4
  function gid_to_wid_(gid) {
    // (gid xor 31578) encoded in base 36
    return parseInt((gid ^ 31578)).toString(36);
  }

  window.GoogleSheets = Polymer({

    is: 'google-sheets',

    /**
     * Fired when the spreadsheet's cell information is available.
     *
     * @event google-sheet-data
     * @param {Object} detail
     * @param {Object} detail.data The data returned by the Spreadsheet API.
     * @param {string} detail.type The type of data that was fetched.
     *     One of 'spreadsheets', 'tab', 'rows' * to correspond to the feed type.
     */

    hostAttributes: {
      hidden: true
    },

    properties: {
      /**
       * A Google Developers client ID. Obtain from [console.developers.google.com](https://console.developers.google.com). Required for accessing a private spreadsheet. Optional if accessing a public spreadsheet.
       */
      clientId: {
        type: String,
        value: '',
        observer: '_configUpdate'
      },

      /**
       * The key of the spreadsheet. This can be found in the URL when viewing
       * the document is Google Docs (e.g. `docs.google.com/spreadsheet/ccc?key=<KEY>`).
       *
       * Leaving off this attribute still returns a list of the users spreadsheets in the `spreadsheets` property.
       */
      key: {
        type: String,
        value: '',
        observer: '_keyChanged'
      },

      /**
       * Tab within a spreadsheet. For example, the first tab in a spreadsheet
       * would be `tab-id="1"`.
       */
      tabId: {
        type: Number,
        value: 1,
        observer: '_configUpdate'
      },

      /**
       * A hint that the spreadsheet is published publicly in Google Docs. Used as a performance optimization.
       * Make sure the sheet is also publicly viewable by anyone in the Share settings.
       *
       * @attribute published
       * @type boolean
       * @default false
       */
      published: {
        type: Boolean,
        value: false,
        observer: '_configUpdate'
      },

      /**
       * The fetched sheet corresponding to the `key` attribute.
       */
      sheet: {
        type: Object,
        value: function() { return {}; },
        readOnly: true,
        notify: true,
        observer: '_sheetChanged'
      },

      /**
       * Meta data about the particular tab that was retrieved for the spreadsheet.
       */
      tab: {
        type: Object,
        value: function() { return {}; },
        readOnly: true,
        notify: true,
        observer: '_tabChanged'
      },

      /**
       * If a spreadsheet `key` is specified, returns a list of cell row data.
       */
      rows: {
        type: Array,
        value: function() { return []; },
        readOnly: true,
        notify: true
      },

      /**
       * List of the user's spreadsheets. Shared across instances.
       */
      spreadsheets: {
        type: Array,
        readOnly: true,
        notify: true,
        value: function() { return []; }
      },

      /**
       * The URL to open this spreadsheet in Google Sheets.
       */
      openInGoogleDocsUrl: {
        type: String,
        computed: '_computeGoogleDocsUrl(key)',
        notify: true
      }
    },

    _worksheetId: null,

    _computeGoogleDocsUrl: function(key) {
      var url = 'https://docs.google.com/spreadsheet/';
      if (key) {
        url += 'ccc?key=' + key;
      }
      return url;
    },

    _configUpdate: function(key, published, tabId, clientId) {
      this._tabIdChanged();
    },

    _keyChanged: function(newValue, oldValue) {
      // TODO(ericbidelman): need to better handle updates to the key attribute.
      // Below doesn't account for private feeds.
      if (this.published) {
        var url = SCOPE_ + '/list/' + this.key + '/' +
                  this.tabId + '/public/values';
        this.$.publicajax.url = url;
        this.$.publicajax.generateRequest();
      }
    },

    _tabIdChanged: function(newValue, oldValue) {
      if (this._worksheetId) {
        this._getCellRows();
      } else if (this.published) {
        this._keyChanged();
      }
    },

    _sheetChanged: function(newValue, oldValue) {
      if (!this.sheet.title) {
        return;
      }

      // Make metadata easily accessible on sheet object.
      var authors = this.sheet.author && this.sheet.author.map(function(a) {
        return {email: a.email.$t, name: a.name.$t};
      });

      this.set('sheet.title', this.sheet.title.$t);
      this.set('sheet.updated', new Date(this.sheet.updated.$t));
      this.set('sheet.authors', authors);

      this._worksheetId = this.sheet.id.$t.split('/').slice(-1)[0];
      this._getWorksheet();
    },

    _tabChanged: function(newValue, oldValue) {
      if (!this.tab.title) {
        return;
      }

      var authors = this.tab.authors = this.tab.author && this.tab.author.map(function(a) {
        return {email: a.email.$t, name: a.name.$t};
      });

      this.set('tab.title', this.tab.title.$t);
      this.set('tab.updated', new Date(this.tab.updated.$t));
      this.set('tab.authors', authors);

      this.fire('google-sheet-data', {
        type: 'tab',
        data: this.tab
      });
    },

    _onSignInSuccess: function(e, detail) {
      var oauthToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse();

      var headers = {
        'Authorization': 'Bearer ' + oauthToken.access_token
      };

      this.$.listsheetsajax.headers = headers;
      this.$.worksheetajax.headers = headers;
      this.$.cellrowsajax.headers = headers;

      // TODO(ericbidelman): don't make this call if this.spreadsheets is
      // already populated from another instance.
      this._listSpreadsheets();
    },

    _onSignInFail: function(e, detail) {
      // TODO(ericbidelman): handle this in some way.
      console.log(e, e.type);
    },

    _listSpreadsheets: function() {
      var url = SCOPE_ + '/spreadsheets/private/full';
      this.$.listsheetsajax.url = url;
      this.$.listsheetsajax.generateRequest();
    },

    _onSpreadsheetList: function(e) {
      e.stopPropagation();

      var feed = e.target.lastResponse.feed;

      this._setSpreadsheets(feed.entry);

      this.fire('google-sheet-data', {
        type: 'spreadsheets',
        data: this.spreadsheets
      });

      // Fetch worksheet feed if key was given and worksheet exists.
      if (this.key) {
        for (var i = 0, entry; entry = feed.entry[i]; ++i) {
          var altLink = getLink_('alternate', entry.link);
          if (altLink && altLink.href.indexOf(this.key) != -1) {
            this._setSheet(entry);
            break;
          }
        }
      }
    },

    _getWorksheet: function() {
      if (!this._worksheetId) {
        throw new Error('workesheetId was not given.');
      }

      var url = SCOPE_ + '/worksheets/' + this._worksheetId +
                '/private/full/' + this.tabId;
      this.$.worksheetajax.url = url;
      this.$.worksheetajax.generateRequest();
    },

    _onWorksheet: function(e) {
      e.stopPropagation();

      // this.tab = e.target.lastResponse.entry;
      this._setTab(e.target.lastResponse.entry);
      this._getCellRows();
    },

    _getCellRows: function() {
      // Use cached data if available.
      var key = generateCacheKey_.call(this);
      if (key in rowDataCache_) {
        this._onCellRows(null, null, rowDataCache_[key]);

        return;
      }

      var url = SCOPE_ + '/list/' +
                this._worksheetId + '/' + this.tabId +
                '/private/full';
      this.$.cellrowsajax.url = url;
      this.$.cellrowsajax.generateRequest();
    },

    _onCellRows: function(e) {
      e.stopPropagation();

      var feed = e.target.lastResponse.feed;

      // Cache data if key doesn't exist.
      var key = generateCacheKey_.call(this);
      if (!(key in rowDataCache_)) {
        rowDataCache_[key] = {response: {feed: feed}};
      }

      // this.rows = feed.entry;
      this._setRows(feed.entry);
      var authors = feed.author && feed.author.map(function(a) {
        return {email: a.email.$t, name: a.name.$t};
      });
      this.set('rows.authors', authors);

      if (this.published) {
        // this.tab = feed;
        this._setTab(feed);
      }

      this.fire('google-sheet-data', {
        type: 'rows',
        data: this.rows
      });
    }

  });

})();
