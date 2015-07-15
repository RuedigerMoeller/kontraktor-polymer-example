
(function() {
  Polymer({

    is: 'gold-email-input',

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
        value: "Email"
      },

      /**
       * The regular expression used to validate the email. Defaults to the
       * regular expression defined in the spec: http://www.w3.org/TR/html-markup/input.email.html#input.email.attrs.value.single.
       * If left blank, then no validation will be applied.
       */
      regex: {
        type: String,
        value: '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*$'
      }
    },

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

    validate: function() {
      // Empty, non-required input is valid. A blank regex means everything is valid.
      if ((!this.required && this.value == '') || this.regex == '') {
        return true;
      }

      // A blank regex mean everything is allowed.
      var valid = new RegExp(this.regex, "i").test(this.value);

      // Update the container and its addons (i.e. the custom error-message).
      this.$.container.invalid = !valid;
      this.$.container.updateAddons({
        inputElement: this.$.input,
        value: this.value,
        invalid: !valid
      });

      return valid;
    },

  })

})();

