
  Polymer({

    is: 'date-input',

    behaviors: [
      Polymer.IronValidatableBehavior
    ],

    properties: {
      /**
       * Set to true to mark the input as required.
       */
      required: {
        type: Boolean,
        value: false
      },

      /**
       * The month component of the date displayed.
       */
      month: {
        type: String
      },

      /**
       * The year component of the date displayed.
       */
      year: {
        type: String
      },

      /**
       * The date object used by the validator. Has two properties, month and year.
       */
      date: {
        notify: true,
        type: Object
      },

      validator: {
        type: String,
        value: 'date-validator'
      },

      ariaLabelPrefix: {
        type:String
      }

    },

    observers: [
      '_computeDate(month,year)'
    ],

    _computeDate: function(month, year) {
      // Months are 0-11.
      this.date = {month: month, year: year};
      this.fire('dateChanged', this.date);
      // Advance cursor to year after month entry
      if (month.length === 2) {
        this.$.expirationYear.focus();
      }
    },

    validate: function() {
      // Empty, non-required input is valid.
      if (!this.required && this.month == '' && this.year == '') {
        return true;
      }
      this.invalid = !this.$.validator.validate(this.date);
      this.fire('iron-input-validate');
      return !this.invalid;
    },

    _computeAriaLabel: function(dateLabel, monthLabel) {
      return dateLabel + ' ' + monthLabel;
    }

  });
