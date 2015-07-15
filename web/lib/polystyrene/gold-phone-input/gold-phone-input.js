
(function() {
  Polymer({

    is: 'gold-phone-input',

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
        value: 'Phone number'
      },

      /*
       * The country code that should be recognized and parsed.
       */
      countryCode: {
        type: String,
        value: '1'
      },

      /*
       * The format of a valid phone number, including formatting but excluding
       * the country code. Use 'X' to denote the digits separated by dashes.
       */
      phoneNumberPattern: {
        type: String,
        value: 'XXX-XXX-XXXX',
        observer: '_phoneNumberPatternChanged'
      }
    },

    observers: [
      '_computeValue(value)'
    ],

    _phoneNumberPatternChanged: function() {
      // Transform the pattern into a regex the iron-input understands.
      var regex = '';
      regex = this.phoneNumberPattern.replace(/\s/g, '\\s');
      regex = regex.replace(/X/gi, '\\d');
      regex = regex.replace(/\+/g, '\\+');
      this.$.input.pattern = regex;

      if (this.autoValidate) {
        this.$.container.invalid = !this.$.input.validate();
      }
    },

    _computeValue: function(value) {
      var start = this.$.input.selectionStart;
      var previousCharADash = this.value.charAt(start - 1) == '-';

      // Remove any already-applied formatting.
      value = value.replace(/-/g, '');
      var shouldFormat = value.length <= this.phoneNumberPattern.replace(/-/g, '').length;
      var formattedValue = '';

      // Fill in the dashes according to the specified pattern.
      var currentDashIndex = 0;
      var totalDashesAdded = 0;
      for (var i = 0; i < value.length; i++) {
        currentDashIndex = this.phoneNumberPattern.indexOf('-', currentDashIndex);

        // Since we remove any formatting first, we need to account added dashes
        // when counting the position of new dashes in the pattern.
        if (shouldFormat && i == (currentDashIndex - totalDashesAdded)) {
          formattedValue += '-';
          currentDashIndex++;
          totalDashesAdded++;
        }

        formattedValue += value[i];
      }
      this.updateValueAndPreserveCaret(formattedValue.trim());

      // If the character right before the selection is a newly inserted
      // dash, we need to advance the selection to maintain the caret position.
      if (!previousCharADash && this.value.charAt(start - 1) == '-') {
        this.$.input.selectionStart = start + 1;
        this.$.input.selectionEnd = start + 1;
      }
    }

  })

})();

