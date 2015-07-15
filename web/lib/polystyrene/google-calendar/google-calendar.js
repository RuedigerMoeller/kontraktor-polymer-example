
  Polymer({

    is: 'google-calendar-list',

    properties: {
      _signedIn: {
        type: Boolean,
        value: false,
        observer: '_signInChanged'
      },
      /**
       * A title to be displayed on top of the calendar list.
       */
      title: {
        type: String,
        value: 'My calendars'
      },
      /**
       * List of calendars
       */
      calendars: {
        type: Array,
        value: function() { return []; },
        readOnly: true
      }
    },

    _signInChanged: function(val) {
      if (val) {
        this.displayCalendars();
      }
      else {
        this._setCalendars([]);
      }
    },

    _computeCalStyle: function(backgroundColor) {
      return 'background-color:' + (backgroundColor || 'gray');
    },
    _computeCalHref: function(calId, calTimeZone) {
      return 'https://www.google.com/calendar/embed?src=' + calId + '&ctz=' + calTimeZone;
    },
    /**
     * Displays the calendar list if the user is signed in to Google.
     */
    displayCalendars: function() {
      if (this._signedIn && this.$.calendar.api) {
          var request = this.$.calendar.api.calendarList.list({"key": ""});

        // var request = this.$.calendar.api.calendarList.list({"key": ""});
        request.execute(function(resp) {
          if (resp.error) {
            console.error("Error with calendarList.list", resp.message)
          } else {
            this._setCalendars(resp.items);
          }
        }.bind(this));
      }
    }
  });
