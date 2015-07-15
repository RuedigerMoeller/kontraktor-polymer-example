
  /** @polymerBehavior */
  Polymer.FirebaseQueryBehavior = {
    properties: {
      /**
       * A Firebase API location that references an accessible document.
       */
      location: {
        type: String,
        notify: true,
        reflectToAttribute: true
      },

      /**
       * Firebase Query object corresponding to `location`.
       */
      query: {
        type: Object,
        notify: true,
        readOnly: true
      },

      /**
       * If true, verbose debugging information will be printed to the console.
       */
      log: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },

      _receivingRemoteChanges: {
        type: Boolean,
        value: false
      }
    },

    observers: [
      '_dataChanged(data.*)'
    ],

    get dataAsObject() {
      if (Array.isArray(this.data)) {
        return this.data.reduce(function(object, value, index) {
          object[index] = value;
        }, {});
      }

      return this.data;
    },

    /**
     * Disconnects the current Firebase Query instance.
     */
    disconnect: function() {
      this.location = '';
    },

    _applyLocalDataChanges: function(changes) {
      // Virtual..
    },

    _applyRemoteDataChange: function(applyChange) {
      this._receivingRemoteChanges = true;
      applyChange.call(this);
      this._receivingRemoteChanges = false;
    },

    _dataChanged: function(changes) {
      if (this._receivingRemoteChanges) {
        return;
      }

      this._applyLocalDataChanges(changes);
    },

    _queryChanged: function(query, oldQuery) {
      if (oldQuery) {
        this._stopListeningToQuery(oldQuery);
      }

      if (query) {
        this._listenToQuery(query);
      }
    },

    _listenToQuery: function(query) {
      this._log('Adding Firebase event handlers.');
      query.on('value', this._onQueryValue, this._onQueryCancel, this);
      query.on('child_added', this._onQueryChildAdded, this._onQueryCancel, this);
      query.on('child_removed', this._onQueryChildRemoved, this._onQueryCancel, this);
      query.on('child_changed', this._onQueryChildChanged, this._onQueryCancel, this);
      query.on('child_moved', this._onQueryChildMoved, this._onQueryCancel, this);
    },

    _stopListeningToQuery: function(query) {
      this._log('Removing Firebase event handlers');
      query.off('value', this._onQueryValue, this);
      query.off('child_added', this._onQueryChildAdded, this);
      query.off('child_removed', this._onQueryChildRemoved, this);
      query.off('child_changed', this._onQueryChildChanged, this);
      query.off('child_moved', this._onQueryChildMoved, this);
    },

    _onQueryValue: function(snapshot) {
      this._log('Firebase Event: "value"', snapshot);
      this.fire('firebase-value', snapshot, { bubbles: false });
    },

    _onQueryChildAdded: function(childSnapshot, previousChildName) {
      this._log('Firebase Event: "child_added"', childSnapshot, previousChildName);
      this.fire('firebase-child-added', {
        childSnapshot: childSnapshot,
        previousChildName: previousChildName
      }, { bubbles: false });
    },

    _onQueryChildRemoved: function(oldChildSnapshot) {
      this._log('Firebase Event: "child_removed"', oldChildSnapshot);
      this.fire('firebase-child-removed', {
        oldChildSnapshot: oldChildSnapshot
      }, { bubbles: false });
    },

    _onQueryChildChanged: function(childSnapshot, previousChildName) {
      this._log('Firebase Event: "child_changed"', childSnapshot, previousChildName);
      this.fire('firebase-child-changed', {
        childSnapshot: childSnapshot,
        previousChildName: previousChildName
      }, { bubbles: false });
    },

    _onQueryChildMoved: function(childSnapshot, previousChildName) {
      this._log('Firebase Event: "child_changed"', childSnapshot, previousChildName);
      this.fire('firebase-child-moved', {
        childSnapshot: childSnapshot,
        previousChildName: previousChildName
      }, { bubbles: false });
    },

    _onQueryCancel: function(error) {
      if (error) {
        this._error('Firebase Error', error);
      }

      this._log('Firebase query subscription cancelled.');
      this.disconnect();
    },

    _log: function() {
      var args;

      if (this.log) {
        args = Array.prototype.slice.call(arguments).map(function(arg) {
          if (arg && typeof arg.val === 'function') {
            return arg.val();
          }

          return arg;
        });

        console.log.apply(console, args);
      }
    },

    _error: function() {
      if (this.log) {
        console.error.apply(console, arguments);
      }
    }
  };
