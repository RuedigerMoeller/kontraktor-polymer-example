

  Polymer({

    is: 'date-validator',

    behaviors: [
      Polymer.IronValidatorBehavior
    ],

    validate: function(date) {
      if (!date)
        return false;

      if (date.month > 12 || date.month < 1)
        return false;

      var then = new Date ('20' + date.year, date.month);
      var now = new Date();
      return (then > now);
    }

  });

