

  Polymer({

    is: 'zip-validator',

    behaviors: [
      Polymer.IronValidatorBehavior
    ],

    validate: function(value) {
      // A valid zipcode is 5 digits or 5 digits, a dash, and 4 more digits.
      var re = /^\d{5}(?:-\d{4})?$/;
      return re.test(value);
    }

  });

