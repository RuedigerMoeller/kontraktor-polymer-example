
  Polymer({
    is: 'firebase-document',

    behaviors: [
      Polymer.FirebaseQueryBehavior
    ],

    properties: {

      /**
       * Firebase Query object corresponding to `location`.
       */
      query: {
        type: Object,
        notify: true,
        computed: '_computeQuery(location)',
        observer: '_queryChanged'
      },

      /**
       * The `data` object mapped to `location`.
       */
      data: {
        type: Object,
        notify: true
      }
    },

    listeners: {
      'firebase-value': '_onFirebaseValue'
    },

    _applyLocalDataChanges: function(change) {
      var pathFragments = change.path.split('.');

      if (pathFragments.length === 1) {
        this._updateRemoteDocument();
        return;
      }

      this._setRemoteDocumentChild(
        pathFragments[1],
        change.base[pathFragments[1]]
      );
    },

    _onFirebaseValue: function(event) {
      this._applyRemoteDataChange(function() {
        this.set('data', event.detail.val());
      });
    },

    _computeQuery: function(location) {
      if (!location) {
        return;
      }

      return new Firebase(location);
    },

    _updateRemoteDocument: function() {
      this._log('Updating remote document');
      this.query.update(this.dataAsObject);
    },

    _setRemoteDocumentChild: function(key, value) {
      this._log('Setting child "' + key + '" to', value);
      this.query.child(key).set(value);
    },

    _removeRemoteDocumentChild: function(key) {
      this._log('Removing child "' + key + '"');
      this.query.child(key).remove();
    }
  });
