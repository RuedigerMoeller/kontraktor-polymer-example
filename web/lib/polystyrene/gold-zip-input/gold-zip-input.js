
(function() {
  Polymer({

    is: 'gold-zip-input',

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
        value: "Zip Code"
      }
    },

    observers: [
      '_computeValue(value)'
    ],

    _computeValue: function(value) {
      var start = this.$.input.selectionStart;
      var previousCharADash = this.value.charAt(start - 1) == '-';

      // Remove any already-applied formatting.
      value = value.replace(/-/g, '');

      // Add a dash after the 5th character
      if (value.length > 5) {
        value = value.substr(0,5) + '-' + value.substr(5)
      }
      this.updateValueAndPreserveCaret(value.trim());

      // If the character right before the selection is a newly inserted
      // dash, we need to advance the selection to maintain the caret position.
      if (!previousCharADash && this.value.charAt(start - 1) == '-') {
        this.$.input.selectionStart = start + 1;
        this.$.input.selectionEnd = start + 1;
      }
    }

  })

})();

