
  Polymer({
    is: 'firebase-collection',

    behaviors: [
      Polymer.FirebaseQueryBehavior
    ],

    properties: {
      /**
       * A pointer to the current Firebase Query instance being used to
       * populate `data`.
       */
      query: {
        type: Object,
        notify: true,
        computed: '_computeQuery(location, limitToFirst, limitToLast, _orderByMethodName, _startAt, _endAt, _equalTo)',
        observer: '_queryChanged'
      },

      /**
       * An ordered array of data items produced by the current Firebase Query
       * instance.
       */
      data: {
        type: Array,
        readOnly: true,
        notify: true,
        value: function() {
          return [];
        }
      },

      /**
       * Specify a child key to order the set of records reflected on the
       * client.
       */
      orderByChild: {
        type: String,
        value: null,
        reflectToAttribute: true
      },

      /**
       * Specify to order by key the set of records reflected on the client.
       */
      orderByKey: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },

      /**
       * Specify to order by value the set of records reflected on the client.
       */
      orderByValue: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },

      /**
       * Specify to order by priority the set of records reflected on the
       * client.
       */
      orderByPriority: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },

      /**
       * Specify a maximum number of records reflected on the client limited to
       * the first certain number of children.
       */
      limitToFirst: {
        type: Number,
        value: null,
        reflectToAttribute: true,
      },

      /**
       * Specify a maximum number of records reflected on the client limited to
       * the last certain number of children.
       */
      limitToLast: {
        type: Number,
        value: null,
        reflectToAttribute: true
      },

      /**
       * Specify a start record for the set of records reflected in the
       * collection.
       */
      startAt: {
        type: String,
        value: null,
        reflectToAttribute: true
      },

      /**
       * Specify an end record for the set of records reflected in the
       * collection.
       */
      endAt: {
        type: String,
        value: null,
        reflectToAttribute: true
      },

      /**
       * Specify to create a query which includes children which match the
       * specified value. The argument type depends on which orderBy*() function
       * was used in this query. Specify a value that matches the orderBy*()
       * type.
       */
      equalTo: {
        type: String,
        value: null,
        reflectToAttribute: true
      },

      _valueMap: {
        type: Object,
        value: function() {
          return {};
        }
      },

      _orderByMethodName: {
        computed: '_computeOrderByMethodName(orderByChild, orderByKey, orderByValue, orderByPriority)'
      },

      _orderByTypeCast: {
        computed: '_computeOrderByTypeCast(orderByChild, orderByKey, orderByValue, orderByPriority)'
      },

      _startAt: {
        computed: '_computeStartAt(startAt, _orderByTypeCast)'
      },

      _endAt: {
        computed: '_computeEndAt(endAt, _orderByTypeCast)'
      },

      _equalTo: {
        computed: '_computeEqualTo(equalTo, _orderByTypeCast)'
      }
    },

    listeners: {
      'firebase-child-added': '_onFirebaseChildAdded',
      'firebase-child-removed': '_onFirebaseChildRemoved',
      'firebase-child-changed': '_onFirebaseChildChanged',
      'firebase-child-moved': '_onFirebaseChildChanged',
    },

    /**
     * Add an item to the document referenced at `location`. A key associated
     * with the item will be created by Firebase, and can be accessed via the
     * Firebase Query instance returned by this method.
     *
     * @param {Object} data A value to add to the document.
     * @return {Object} A Firebase Query instance referring to the added item.
     */
    add: function(data) {
      var query;

      this._log('Adding new item to collection with value:', data);

      query = this.query.ref().push();
      query.set(data);

      return query;
    },

    /**
     * Remove an item from the document referenced at `location`. The item
     * is assumed to be an identical reference to an item already in the
     * `data` Array.
     *
     * @param {Object} data An identical reference to an item in `this.data`.
     */
    remove: function(data) {
      if (data == null || data.__firebaseKey__ == null) {
        this._error('Failed to remove unknown value:', data);
        return;
      }

      this._log('Removing collection item "' + data.__firebaseKey__ + '"', data.value);

      this.removeByKey(data.__firebaseKey__);
    },

    /**
     * Look up an item in the local `data` Array by key.
     *
     * @param {String} key The key associated with the item in the parent
     * document.
     */
    getByKey: function(key) {
      return this._valueMap[key];
    },

    /**
     * Remove an item from the document associated with `location` by key.
     *
     * @param {String} key The key associated with the item in the document
     * located at `location`.
     */
    removeByKey: function(key) {
      this.query.ref().child(key).remove();
    },

    _applyLocalDataChanges: function(change) {
      var pathParts = change.path.split('.');
      var index;
      var value;

      if (pathParts.length < 2 || pathParts[1] === 'splices') {
        return;
      }

      index = parseInt(pathParts[1], 10);
      value = this.data[index];
      this.query.ref().child(value.__firebaseKey__).set(value);
    },

    _computeQuery: function(location, limitToFirst, limitToLast, orderByMethodName, startAt, endAt, equalTo) {
      var query;

      if (!location) {
        return;
      }

      query = new Firebase(location);

      if (orderByMethodName) {
        if (orderByMethodName === 'orderByChild') {
          query = query[orderByMethodName](this.orderByChild);
        } else {
          query = query[orderByMethodName]();
        }
      }

      if (startAt != null) {
        query = query.startAt(startAt);
      }

      if (endAt != null) {
        query = query.endAt(endAt);
      }

      if (equalTo != null) {
        query = query.equalTo(equalTo);
      }

      if (limitToLast != null) {
        query = query.limitToLast(limitToLast);
      }

      if (limitToFirst != null) {
        query = query.limitToFirst(limitToFirst);
      }

      return query;
    },

    _queryChanged: function() {
      Polymer.FirebaseQueryBehavior._queryChanged.apply(this, arguments);
      this._valueMap = {};
      this._setData([]);
    },

    _computeOrderByMethodName: function(orderByChild, orderByKey, orderByValue, orderByPriority) {
      if (orderByChild) {
        return 'orderByChild';
      }

      if (orderByKey) {
        return 'orderByKey';
      }

      if (orderByValue) {
        return 'orderByValue';
      }

      if (orderByPriority) {
        return 'orderByPriority';
      }

      return null;
    },

    _computeOrderByTypeCast: function(orderByChild, orderByKey, orderByValue, orderByPriority) {
      if (orderByKey) {
        return String;
      }

      return function(value) {
        return value;
      }
    },

    _computeStartAt: function(startAt, orderByTypeCast) {
      return orderByTypeCast(startAt);
    },

    _computeEndAt: function(endAt, orderByTypeCast) {
      return orderByTypeCast(endAt);
    },

    _computeEqualTo: function(equalTo, orderByTypeCast) {
      return orderByTypeCast(equalTo);
    },

    _valueFromSnapshot: function(snapshot) {
      var value = snapshot.val();

      if (!(value instanceof Object)) {
        value = {
          value: value,
          __firebasePrimitive__: true
        };
      }

      value.__firebaseKey__ = snapshot.key();

      return value;
    },

    _valueToPersistable: function(value) {
      var persistable;

      if (value.__firebasePrimitive__) {
        return value.value;
      }

      persistable = {};

      for (var property in value) {
        if (property === '__firebaseKey__') {
          continue;
        }

        persistable[property] = value[property];
      }

      return persistable;
    },

    _onFirebaseChildAdded: function(event) {
      this._applyRemoteDataChange(function() {
        var value = this._valueFromSnapshot(event.detail.childSnapshot);
        var previousValueKey = event.detail.previousChildName;
        var index = previousValueKey != null ?
          this.data.indexOf(this._valueMap[previousValueKey]) + 1 : 0;

        this._valueMap[value.__firebaseKey__] = value;

        this.splice('data', index, 0, value);
      });
    },

    _onFirebaseChildRemoved: function(event) {
      this._applyRemoteDataChange(function() {
        var key = event.detail.oldChildSnapshot.key();
        var value = this._valueMap[key];

        if (!value) {
          this._error('Received firebase-child-removed event for unknown child "' + key + '"');
          return;
        }

        this._valueMap[key] = null;
        this.splice('data', this.data.indexOf(value), 1);
      });
    },

    _onFirebaseChildChanged: function(event) {
      this._applyRemoteDataChange(function() {
        var value = this._valueFromSnapshot(event.detail.childSnapshot);
        var oldValue = this._valueMap[value.__firebaseKey__];

        if (!oldValue) {
          this._error('Received firebase-child-changed event for unknown child "' + value.__firebaseKey__ + '"');
          return;
        }

        this._valueMap[oldValue.__firebaseKey__] = null;
        this._valueMap[value.__firebaseKey__] = value;
        this.splice('data', this.data.indexOf(oldValue), 1, value);
      });
    },

    _onFirebaseChildMoved: function(event) {
      this._applyRemoteDataChange(function() {
        var key = event.detail.childSnapshot.key();
        var value = this._valueMap[key];
        var previousChild;
        var newIndex;

        if (!value) {
          this._error('Received firebase-child-moved event for unknown child "' + key + '"');
          return;
        }

        previousValue = event.detail.previousChildName != null ?
          this._valueMap[event.detail.previousChildName] : null;
        newIndex = previousValue != null ?
          this.data.indexOf(previousValue) + 1 : 0;

        this.splice('data', this.data.indexOf(value), 1);
        this.splice('data', newIndex, 0, value);
      });
    }
  });
