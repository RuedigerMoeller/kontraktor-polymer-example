
(function() {

  Polymer({

    is: 'gold-cc-expiration-input',

    behaviors: [
      Polymer.PaperInputBehavior,
      Polymer.IronFormElementBehavior
    ],

    properties: {
      /**
       * The label for this input.
       */
      label: {
        type: String,
        value: "Expiration Date"
      }
    },

    listeners: {
      'dateChanged': '_dateChanged'
    },

    _dateChanged: function(event) {
      if (event.detail.month && event.detail.year)
        this.value = event.detail.month + '/' + event.detail.year;
    },

    _computeMonth: function(value) {
      // Date is in MM/YY format.
      return value.split('/')[0];
    },

    _computeYear: function(value) {
      // Date is in MM/YY format.
      return value.split('/')[1];
    }
      
  })

})();

