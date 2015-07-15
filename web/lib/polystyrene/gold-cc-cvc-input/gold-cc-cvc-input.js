
(function() {
  Polymer({

    is: 'gold-cc-cvc-input',

    properties: {

      /**
       * The label for this input.
       */
      label: {
        type: String,
        value: 'CVC'
      },

      /**
       * The type of card that the CVC is for.
       */
      cardType: {
        type: String,
        value: ''
      },

      _requiredLength: {
        type: Number,
        computed: '_computeRequiredLength(cardType)'
      },

      _amex: {
        type: Boolean,
        computed: '_computeIsAmex(cardType)'
      }
    },

    behaviors: [
      Polymer.PaperInputBehavior,
      Polymer.IronFormElementBehavior
    ],

    listeners: {
      'input': '_onInput'
    },

    ready: function() {
      this._onInput();
    },

    _onInput: function() {
      if (this.autoValidate) {
        this.validate();
      }
    },

    _computeRequiredLength: function(cardType) {
      return this._computeIsAmex(cardType) ? 4 : 3;
    },

    _computeIsAmex: function(cardType) {
      return cardType.toLowerCase() == 'amex';
    },

    validate: function() {
      // Empty, non-required input is valid.
      if (!this.required && this.value == '') {
        return true;
      }

      var valid = this.value.length == this._requiredLength;

      // Update the container and its addons (i.e. the custom error-message).
      this.$.container.invalid = !valid;
      this.$.container.updateAddons({
        inputElement: this.$.input,
        value: this.value,
        invalid: !valid
      });

      return valid;
    }
  })

})();

