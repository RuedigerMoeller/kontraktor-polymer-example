

  (function() {
    'use strict';

    Polymer({

      is: 'google-analytics-dashboard',

      properties: {
        /**
         * The `query` attribute represents the internal query object of this
         * dashboard. It is updated when control elements fire the
         * `analytics-dashboard-control-change` event and pass along query data.
         */
        query: {
          type: Object,
          value: function() { return {}; }
        },

        /**
         * True if user has been authorized
         */
        authorized: {
          type: Boolean,
          value: false,
          reflectToAttribute: true
        }

      },

      listeners: {
        'analytics-dashboard-control-change': 'queryUpdated'
      },

      ready: function() {
       this.updateChildren();
      },

      /**
       * The `queryUpdated` method is the callback for whenever the
       * `analytics-dashboard-control-change` event is fired. It updates the
       * query attribute, which is then sent to child charts.
       *
       * @method queryUpdated
       * @param {CustomEvent} event - The event with the query data.
       */
      queryUpdated: function(event) {
        // Update `this.query` with the passed event data.
        Object.keys(event.detail).forEach(function(key) {
          this.query[key] = event.detail[key];
        }.bind(this))

        this.updateChildren();
      },

      /**
       * The `updateChildren` method updates each of this dashboards
       * `<google-analytics-chart>` element with its current query value.
       *
       * @method updateChildren
       */
      updateChildren: function() {
        if (!this.authorized) {
          return;
        }
        var charts = Polymer.dom(this).querySelectorAll('google-analytics-chart');
        for (var i = 0, chart; chart = charts[i]; i++) {
          Object.keys(this.query).forEach(function(key) {
            chart[key] = this.query[key];
          }.bind(this));
        }
      },

      _signedIn: function() {
        this.authorized = true;
        this.updateChildren();
      },

      _signedOut: function() {
        this.authorized = false;
      }

    });

  })();

