

  (function() {

    'use strict';

    /**
     * Fired when the users changes the start or end date.
     *
     * @param {Object} query The updated query params.
     * @event analytics-dashboard-control-change
     */


    var nDaysAgo = /(\d+)daysAgo/;
    var dateFormat = /\d{4}\-\d{2}\-\d{2}/;

    /**
     * Convert a date acceptable to the Core Reporting API (e.g. `today`,
     * `yesterday` or `NdaysAgo`) into the format YYYY-MM-DD. Dates
     * already in that format are simply returned.
     * @return {string} The formatted date.
     */
    function convertDate(str) {
      // If str is in the proper format, do nothing.
      if (dateFormat.test(str)) return str

      var match = nDaysAgo.exec(str);
      if (match) {
        return daysAgo(+match[1])
      } else if (str == 'today') {
        return daysAgo(0)
      } else if (str == 'yesterday') {
        return daysAgo(1)
      } else {
        throw new Error('Cannot convert date ' + str);
      }
    }

    /**
     * Accept a number and return a date formatted as YYYY-MM-DD that
     * represents that many days ago.
     * @return {string} The formatted date.
     */
    function daysAgo(numDays) {
      var date = new Date();
      date.setDate(date.getDate() - numDays);
      var month = String(date.getMonth() + 1);
      month = month.length == 1 ? '0' + month: month;
      var day = String(date.getDate());
      day = day.length == 1 ? '0' + day: day;
      return date.getFullYear() + '-' + month + '-' + day;
    }

    Polymer({

      is: 'google-analytics-date-selector',

      properties: {
        /**
         * The `startDate` attribute is the start date for fetching Analytics
         * data. Requests can specify a start date formatted as YYYY-MM-DD, or
         * as a relative date (e.g., today, yesterday, or NdaysAgo where N is a
         * positive integer).
         *
         * See the <a href="https://developers.google.com/analytics/devguides/reporting/core/v3/reference#startDate">Core Reporting API parameter reference</a> for more details.
         *
         * @attribute startDate
         * @default '7daysAgo'
         * @type string
         */
        startDate: {
          type: String,
          value: convertDate('7daysAgo'),
          observer: 'startDateChanged',
          notify: true
        },

        /**
         * The `endDate` attribute is the end date for fetching Analytics
         * data. Requests can specify an end date formatted as YYYY-MM-DD, or
         * as a relative date (e.g., today, yesterday, or NdaysAgo where N is a
         * positive integer).
         *
         * See the <a href="https://developers.google.com/analytics/devguides/reporting/core/v3/reference#endDate">Core Reporting API parameter reference</a> for more details.
         *
         * @attribute endDate
         * @default 'yesterday'
         * @type string
         */
        endDate: {
          type: String,
          value: convertDate('yesterday'),
          observer: 'endDateChanged',
          notify: true
        },

        /**
         * The `minStartDate` attribute is used as the `min` attribute on the
         * start date `<input>`.
         *
         * @attribute minStartDate
         * @default '2005-01-01'
         * @type string
         */
        minStartDate: {
          type: String,
          value: '2005-01-01'
        },

        /**
         * The `maxEndDate` attribute is used as the `max` attribute on the
         * end date `<input>`.
         *
         * @attribute maxEndDate
         * @default 'today'
         * @type string
         */
        maxEndDate: {
          type: String,
          value: convertDate('today')
        }
      },

      startDateChanged: function(cur, old) {
        this.startDate = convertDate(cur);
        this.$.startDate.value = this.startDate;
        this.fire('analytics-dashboard-control-change', {
          startDate: this.startDate
        });
      },

      endDateChanged: function(cur, old) {
        this.endDate = convertDate(cur);
        this.$.endDate.value = this.endDate;
        this.fire('analytics-dashboard-control-change', {
          endDate: this.endDate
        });
      }
    });

  }());

