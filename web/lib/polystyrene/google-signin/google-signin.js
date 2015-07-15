
  (function() {

    /**
     * Enum brand values.
     * @readonly
     * @enum {string}
     */
    var BrandValue = {
        GOOGLE: 'google',
        PLUS: 'google-plus'
    };

    /**
     * Enum height values.
     * @readonly
     * @enum {string}
     */
    var HeightValue = {
      SHORT: 'short',
      STANDARD: 'standard',
      TALL: 'tall'
    };

    /**
     * Enum button label default values.
     * @readonly
     * @enum {string}
     */
    var LabelValue = {
      STANDARD: 'Sign in',
      WIDE: 'Sign in with Google',
      WIDE_PLUS: 'Sign in with Google+'
    };

    /**
     * Enum theme values.
     * @readonly
     * @enum {string}
     */
    var ThemeValue = {
      LIGHT: 'light',
      DARK: 'dark'
    };

    /**
     * Enum width values.
     * @readonly
     * @enum {string}
     */
    var WidthValue = {
      ICON_ONLY: 'iconOnly',
      STANDARD: 'standard',
      WIDE: 'wide'
    };

/**
&lt;google-signin&gt; is used to authenticate with Google, allowing you to interact
with other Google APIs such as Drive and Google+.

<img style="max-width:100%;" src="https://cloud.githubusercontent.com/assets/107076/6791176/5c868822-d16a-11e4-918c-ec9b84a2db45.png"/>

If you do not need to show the button, use companion `<google-signin-aware>` element to declare scopes, check authentication state.

#### Examples

    <google-signin client-id="..." scopes="https://www.googleapis.com/auth/drive"></google-signin>

    <google-signin label-signin="Sign-in" client-id="..." scopes="https://www.googleapis.com/auth/drive"></google-signin>

    <google-signin theme="dark" width="iconOnly" client-id="..." scopes="https://www.googleapis.com/auth/drive"></google-signin>


#### Notes

The attribute `clientId` is provided in your Google Developers Console
(https://console.developers.google.com).

The `scopes` attribute allows you to specify which scope permissions are required
(e.g do you want to allow interaction with the Google Drive API). Many APIs also
need to be enabled in the Google Developers Console before you can use them.

The `requestVisibleActions` attribute is necessary if you want to write app
activities (https://developers.google.com/+/web/app-activities/) on behalf of
the user. Please note that this attribute is only valid in combination with the
plus.login scope (https://www.googleapis.com/auth/plus.login).

Use label properties to customize prompts.

The button can be styled in using the `height`, `width`, and `theme` attributes.
These attributes help you follow the Google+ Sign-In button branding guidelines
(https://developers.google.com/+/branding-guidelines).

The `google-signin-success` event is triggered when a user successfully authenticates
and `google-signed-out` is triggered when user signeds out.
You can also use `isAuthorized` attribute to observe user's authentication state.

Additional events, such as `google-signout-attempted` are
triggered when the user attempts to sign-out and successfully signs out.

The `google-signin-necessary` event is fired when scopes requested via
google-signin-aware elements require additional user permissions.

#### Testing

By default, the demo accompanying this element is setup to work on localhost with
port 8080. That said, you *should* update the `clientId` to your own one for
any apps you're building. See the Google Developers Console
(https://console.developers.google.com) for more info.

@demo
*/

    Polymer({

      is: 'google-signin',

    /**
     * Fired when user is signed in.
     * You can use auth2 api to retrieve current user: `gapi.auth2.getAuthInstance().currentUser.get();`
     * @event google-signin-success
     */

    /**
     * Fired when the user is signed-out.
     * @event google-signed-out
     */

    /**
     * Fired if user requires additional authorization
     * @event google-signin-necessary
     */

    /**
     * Fired when signed in, and scope has been authorized
     * @param {Object} result Authorization result.
     * @event google-signin-aware-success
     */

    /**
     * Fired when this scope is not authorized
     * @event google-signin-aware-signed-out
     */
      properties: {
        /**
         * App package name for android over-the-air installs.
         * See the relevant [docs](https://developers.google.com/+/web/signin/android-app-installs)
         */
        appPackageName: {
          type: String,
          value: ''
        },

        /**
         * The brand being used for logo and styling.
         *
         * @default 'google'
         */
        brand: {
          type: String,
          value: ''
        },

        /** @private */
        _brand: {
          type: String,
          computed: '_computeBrand(brand, hasPlusScopes)'
        },

        /**
         * a Google Developers clientId reference
         */
        clientId: {
          type: String,
          value: ''
        },

        /**
         * The cookie policy defines what URIs have access to the session cookie
         * remembering the user's sign-in state.
         * See the relevant [docs](https://developers.google.com/+/web/signin/reference#determining_a_value_for_cookie_policy) for more information.
         *
         * @default 'single_host_origin'
         */
        cookiePolicy: {
          type: String,
          value: ''
        },

        /**
         * The height to use for the button.
         *
         * Available options: short, standard, tall.
         *
         * @type {HeightValue}
         */
        height: {
          type: String,
          value: 'standard'
        },

        /**
         * By default the ripple expands to fill the button. Set this to true to
         * constrain the ripple to a circle within the button.
         */
        fill: {
          type: Boolean,
          value: true
        },

        /**
         * An optional label for the button for additional permissions.
         */
        labelAdditional: {
          type: String,
          value: 'Additional permissions required'
        },

        /**
         * An optional label for the sign-in button.
         */
        labelSignin: {
          type: String,
          value: ''
        },

        _labelSignin: {
          type: String,
          computed: '_computeSigninLabel(labelSignin, width, _brand)'
        },
        /**
         * An optional label for the sign-out button.
         */
        labelSignout: {
          type: String,
          value: 'Sign out'
        },

        /**
         * If true, the button will be styled with a shadow.
         */
        raised: {
          type: Boolean,
          value: false
        },

        /**
         * The app activity types you want to write on behalf of the user
         * (e.g http://schemas.google.com/AddActivity)
         */
        requestVisibleActions: {
          type: String,
          value: ''
        },

        /**
         * The scopes to provide access to (e.g https://www.googleapis.com/auth/drive)
         * and should be space-delimited.
         */
        scopes: {
          type: String,
          value: ''
        },

        /**
         * The theme to use for the button.
         *
         * Available options: light, dark.
         *
         * @attribute theme
         * @type {ThemeValue}
         * @default 'dark'
         */
        theme: {
          type: String,
          value: 'dark'
        },

        /**
         * The width to use for the button.
         *
         * Available options: iconOnly, standard, wide.
         *
         * @type {WidthValue}
         */
        width: {
          type: String,
          value: 'standard'
        },

        _brandIcon: {
          type: String,
          computed: '_computeIcon(_brand)'
        },

        /**
         * True if *any* element has google+ scopes
         */
        hasPlusScopes: {
          type: Boolean,
          notify: true,
          value: false
        },

        /**
         * True if additional authorization required globally
         */
        needAdditionalAuth: {
          type: Boolean,
          value: false
        },

        /**
         * Is user signed in?
         */
        signedIn: {
          type: Boolean,
          notify: true,
          value: false,
          observer: '_observeSignedIn'
        },

        /**
         * True if authorizations for *this* element have been granted
         */
        isAuthorized: {
          type: Boolean,
          notify: true,
          value: false
        }

      },

      _computeButtonClass: function(height, width, theme, signedIn, brand, needAdditionalAuth) {
        return "height-" + height + " width-" + width + " theme-" + theme + " signedIn-" + signedIn + " brand-" + brand + "  additionalAuth-" + needAdditionalAuth;
      },

      _computeIcon: function(brand) {
        return "google:" + brand;
      },

      /* Button state computed */
      _computeButtonIsSignIn: function(signedIn, additionalAuth) {
        return !signedIn;
      },

      _computeButtonIsSignOut: function(signedIn, additionalAuth) {
        return signedIn && !additionalAuth;
      },

      _computeButtonIsSignOutAddl: function(signedIn, additionalAuth) {
        return signedIn && additionalAuth;
      },

      _computeBrand: function(attrBrand, hasPlusScopes) {
        var newBrand;
        if (attrBrand) {
          newBrand = attrBrand;
        } else if (hasPlusScopes) {
          newBrand = BrandValue.PLUS;
        } else {
          newBrand = BrandValue.GOOGLE;
        };
        return newBrand;
      },

      _observeSignedIn: function(newVal, oldVal) {
        if (newVal) {
          if (this.needAdditionalAuth)
            this.fire('google-signin-necessary');
          this.fire('google-signin-success');
        }
        else
          this.fire('google-signed-out');
      },

      /**
       * Determines the proper label based on the attributes.
       */
      _computeSigninLabel: function(labelSignin, width, _brand) {
        if (labelSignin) {
          return labelSignin;
        } else {
          switch(width) {

            case WidthValue.WIDE:
              return (_brand == BrandValue.PLUS) ?
                LabelValue.WIDE_PLUS : LabelValue.WIDE;

            case WidthValue.STANDARD:
              return LabelValue.STANDARD;

            case WidthValue.ICON_ONLY:
              return '';

            default:
              console.warn("bad width value: ", width);
              return LabelValue.STANDARD;
          }
        }
      },

      /** Sign in user. Opens the authorization dialog for signing in.
       * The dialog will be blocked by a popup blocker unless called inside click handler.
       */
      signIn: function () {
        this.$.aware.signIn();
      },

      _signInKeyPress: function (e) {
        if (e.which == 13 || e.keyCode == 13 || e.which == 32 || e.keyCode == 32) {
          e.preventDefault();
          this.signIn();
        }
      },

      /** Sign out the user */
      signOut: function () {
        this.fire('google-signout-attempted');
        this.$.aware.signOut();
      },

      _signOutKeyPress: function (e) {
        if (e.which == 13 || e.keyCode == 13 || e.which == 32 || e.keyCode == 32) {
          e.preventDefault();
          this.signOut();
        }
      }
    });
  }());
