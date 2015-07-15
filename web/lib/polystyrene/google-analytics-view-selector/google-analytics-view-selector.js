

  (function() {
    'use strict';

    Polymer({

      is: 'google-analytics-view-selector',

      /**
       * Fired when the users changes the view
       *
       * @param {Object} query The updated query params.
       * @event analytics-dashboard-control-change
       */

      properties: {

        /**
         * The `ids` attribute, when found is used to preselect the chosen
         * account, property, and view.
         *
         * See the <a href="https://developers.google.com/analytics/devguides/reporting/core/v3/reference#ids">Core Reporting API parameter reference</a> for more details.
         *
         * @property ids
         * @type string
         */
        ids: {
          type: String,
          observer: 'idsChanged',
          notify: true
        },

        /**
         * The `summaries` attribute contains an account summaries utility object
         * with various helper methods for quickly getting account data.
         *
         * See the <a href="https://github.com/googleanalytics/javascript-api-utils">Github repo</a> for more details.
         *
         * @property summaries
         * @type Object
         */
        summaries: {
          type: Object,
          value: null
        },

        /**
         * The `account` attribute is the currently selected account.
         *
         * @property account
         * @type Object
         */
        account: {
          type: Object,
          observer: 'accountChanged'
        },

        /**
         * The `property` attribute is the currently selected property.
         *
         * @property property
         * @type Object
         */
        property: {
          type: Object,
          observer: 'propertyChanged'
        },

        /**
         * The `view` attribute is the currently selected view.
         *
         * @property view
         * @type Object
         */
        view: {
          type: Object,
          observer: 'viewChanged'
        },

         /**
         * True if setup is ready
         *
         * @attribute setupReady
         * @type Boolean
         */
        setupReady: {
          type: Boolean,
          observer: 'setupReadyChanged'
        }

      },

      setupReadyChanged: function(newVal, oldVal) {
        if (newVal) {
          gaApiUtils.accountSummaries.get().then(function(accountSummaries) {
            this.summaries = accountSummaries;
            this.accounts = accountSummaries.all();

            if (this.ids) {
              // Manually call `idsChanged` here. The first change event will
              // likely happen prior to fetching the accountSummaries data.
              this.idsChanged(null, this.ids);
            } else {
              // When there's no `ids` set, just select the first account,
              // which will trigger change events and set the property and view.
              this.account = this.accounts[0];
            }
          }.bind(this));
        }
        else {
          this.summaries = null;
          this.accounts = null;
          this.account = null;
          this.property = null;
          this.view = null;
          this.ids = null;
        }
      },

      /**
       * The `updateAccount` method is bound to the change event on the
       * account `<select>`. It updates the property and view `<select>`s based
       * on the new account data. It also updates the `ids` attribute.
       */
      updateAccount: function() {
        this.account = this.summaries.getAccount(this.$.account.value);
      },

      /**
       * The `updateProperty` method is bound to the change event on the
       * property `<select>`. It updates the view `<select>` based
       * on the new property data. It also updates the `ids` attribute.
       */
      updateProperty: function() {
        this.property = this.summaries.getProperty(this.$.property.value);
      },

      /**
       * The `updateView` method is bound to the change event on the
       * view `<select>`. It updates the `ids` attribute.
       */
      updateView: function() {
        this.view = this.summaries.getView(this.$.view.value);
      },

      accountChanged: function(newAccount, oldAccount) {
        if (newAccount) {
          this.property = newAccount.properties[0];
        }
      },

      propertyChanged: function(newProperty, oldProperty) {
        if (newProperty) {
          this.view = newProperty.views[0];
          // this.view = Path.get('views[0]').getValueFrom(newProperty);
        }
      },

      viewChanged: function(newView, oldView) {
        this.ids = newView && 'ga:' + newView.id;
      },

      idsChanged: function(newIds, oldIds) {
        // When `ids` is set or updated prior to fetching the account
        // summaries, do nothing.
        if (!this.summaries) return;

        var viewId = newIds && newIds.slice(3);
        var account = this.summaries.getAccountByViewId(viewId);
        var property = this.summaries.getPropertyByViewId(viewId);
        var view = this.summaries.getView(viewId);

        // Make sure the account data is valid before firing any events.
        if (account && property && view) {
          this.account = account;
          this.property = property;
          this.view = view;

          this.fireChangeEvent();
        }
        // If the account data isn't valid, and there's no previous value
        // to fall back to, default to the first account.
        else if (!oldIds) {
          this.account = this.summaries.all()[0];
        }
      },

      /**
       * Fire a change event passing all the currently stored data.
       */
      fireChangeEvent: function() {
        this.fire('analytics-dashboard-control-change', {
          ids: this.ids,
          account: this.account,
          property: this.property,
          view: this.view
        });
      }

    });

  })();

