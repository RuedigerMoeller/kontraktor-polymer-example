
  Polymer({
    is: 'firebase-auth',

    properties: {
      /**
       * Firebase location URL (must have simple login enabled via Forge interface).
       */
      location: {
        type: String,
        reflectToAttribute: true,
        observer: '_locationChanged'
      },

      /**
       * Default login provider type.  May be one of: `anonymous`, `custom`, `password`
       * `facebook`, `github`, `twitter`, `google`.
       */
      provider: {
        type: String,
        reflectToAttribute: true,
        value: 'anonymous'
      },

      /**
       * When logged in, this property reflects the firebase user auth object.
       */
      user: {
        type: Object,
        readOnly: true,
        notify: true
      },

      /**
       * When true, login will be attempted if login status check determines no user is
       * logged in.  Should generally only be used with provider types that do not present
       * a login UI, such as 'anonymous'.
       */
      autoLogin: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },

      /**
       * When true, login status can be determined by checking `user` property.
       */
      statusKnown: {
        type: Boolean,
        value: false,
        notify: true,
        readOnly: true,
        reflectToAttribute: true
      },

      /**
       * When true, authentication will try to redirect instead of using a
       * popup if possible.
       */
      redirect: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },

      /**
       * Provider-specific parameters to pass to login.  May be overridden at `login()`-time.
       */
      params: {
        type: Object
      },

      /**
       * Provider-specific options to pass to login, for provider types that take a second
       * object to pass firebase-specific options.  May be overridden at `login()`-time.
       */
      options: {
        type: Object
      },

      /**
       * A pointer to the Firebase instance being used by the firebase-auth element.
       */
      ref: {
        type: Object,
        readOnly: true,
        notify: true
      },

      _boundAuthHandler: {
        value: function() {
          return this._authHandler.bind(this);
        }
      },

      _boundOnlineHandler: {
        value: function() {
          return this._onlineHandler.bind(this);
        }
      },

      _queuedLogin: {
        type: Object
      }
    },

    attached: function() {
      window.addEventListener('online', this._boundOnlineHandler);
    },

    detached: function() {
      window.removeEventListener('online', this._boundOnlineHandler);
      this.ref.offAuth(this._boundAuthHandler);
    },

    _locationChanged: function(location) {
      if (this.ref) {
        this.ref.offAuth(this._boundAuthHandler);
      }

      if (location) {
        this._setRef(new Firebase(location));
        this.ref.onAuth(this._boundAuthHandler);
      } else {
        this._setRef(null)
      }
    },

    _loginHandler: function(error, user) {
      if (error) {
        // an error occurred while attempting login
        this.fire('error', error);
      } else {
        this._authHandler(user);
      }
    },

    _authHandler: function(user) {
      if (user) {
        // user authenticated with Firebase
        this._setUser(user);
        this._setStatusKnown(true);
        this.fire('login', {user: user});
      } else {
        this._setUser(null);

        if (this.statusKnown) {
          this._setStatusKnown(false);
          this.fire('logout');
        }

        if (this._queuedLogin) {
          this.login(this._queuedLogin.params, this._queuedLogin.options);
          this._queuedLogin = null;
        } else if (!this.statusKnown && this.autoLogin) {
          this.login();
        }

        this._setStatusKnown(true);
      }
    },

    /**
     * Performs a login attempt, using the `provider` specified via attribute/property,
     * or optionally via `provider` argument to the `login` function.  Optionally,
     * provider-specific login parameters can be specified via attribute (JSON)/property,
     * or via the `params` argument to the `login` function.
     *
     * If the login is successful, the `login` event is fired, with `e.detail.user`
     * containing the authenticated user object from Firebase.
     *
     * If login fails, the `error` event is fired, with `e.detail` containing error
     * information supplied from Firebase.
     *
     * If the browswer supports `navigator.onLine` network status reporting and the
     * network is currently offline, the login attempt will be queued until the network
     * is restored.
     *
     * @method login
     * @param {string} params (optional)
     * @param {string} options (optional)
     */
    login: function(params, options) {
      if (navigator.onLine === false) {
        this._queuedLogin = {params: params, options: options};
      } else {
        params = params || (this.params && JSON.parse(this.params)) || undefined;
        options = options || (this.options && JSON.parse(this.options)) || undefined;
        switch(this.provider) {
          case 'password':
            this.ref.authWithPassword(params, this._loginHandler.bind(this), options);
            break;
          case 'anonymous':
            this.ref.authAnonymously(this._loginHandler.bind(this), params);
            break;
          case 'custom':
            this.ref.authWithCustomToken(params.token, this._loginHandler.bind(this));
            break;
          case 'facebook':
          case 'google':
          case 'github':
          case 'twitter':
            if (this.redirect) {
              this.ref.authWithOAuthRedirect(this.provider, this._loginHandler.bind(this), params);
            } else {
              this.ref.authWithOAuthPopup(this.provider, this._loginHandler.bind(this), params);
            }
            break;
          default:
            throw 'Unknown provider: ' + this.provider;
        }
      }
    },

    /**
     * Performs a logout attempt.
     *
     * If the login is successful, the `logout` event is fired.
     *
     * If login fails, the `error` event is fired, with `e.detail` containing error
     * information supplied from Firebase.
     *
     * If the browswer supports `navigator.onLine` network status reporting and the
     * network is currently offline, the logout attempt will be queued until the network
     * is restored.
     *
     * @method logout
     */
    logout: function() {
      if (navigator.onLine === false) {
        this.queuedLogout = true;
      } else {
        this.ref.unauth();
      }
    },

    _onlineHandler: function() {
      if (this.queuedLogout) {
        this.queuedLogout = false;
        this.logout();
      } else if (this.queuedLogin) {
        this.login(this.queuedLogin.params, this.queuedLogin.options);
        this.queuedLogin = null;
      }
    },

    /**
     * Creates a "password provider"-based user account.
     *
     * If the operation is successful, the `user-created` event is fired.
     *
     * If the operation fails, the `error` event is fired, with `e.detail`
     * containing error information supplied from Firebase.
     *
     * @method createUser
     * @param {string} email
     * @param {string} password
     */
    createUser: function(email, password) {
        this.ref.createUser({email: email, password: password}, function(error) {
          if (!error) {
            this.fire('user-created');
          } else {
            this.fire('error', error);
          }
        }.bind(this));
      },

    /**
     * Changes the password of a "password provider"-based user account.
     *
     * If the operation is successful, the `password-changed` event is fired.
     *
     * If the operation fails, the `error` event is fired, with `e.detail`
     * containing error information supplied from Firebase.
     *
     * @method changePassword
     * @param {string} email
     * @param {string} oldPassword
     * @param {string} newPassword
     */
    changePassword: function(email, oldPassword, newPassword) {
      this.ref.changePassword({
        email: email,
        oldPassword: oldPassword,
        newPassword: newPassword
      }, function(error) {
        if (!error) {
          this.fire('password-changed');
        } else {
          this.fire('error', error);
        }
      }.bind(this));
    },

    /**
     * Sends a password reset email for a "password provider"-based user account.
     *
     * If the operation is successful, the `password-reset` event is fired.
     *
     * If the operation fails, the `error` event is fired, with `e.detail`
     * containing error information supplied from Firebase.
     *
     * @method sendPasswordResetEmail
     * @param {string} email
     */
    sendPasswordResetEmail: function(email) {
      this.ref.resetPassword({email: email}, function(error) {
        if (!error) {
          this.fire('password-reset');
        } else {
          this.fire('error', error);
        }
      }.bind(this));
    },

    /**
    * Changes the email of a "password provider"-based user account.
    *
    * If the operation is successful, the `email-changed` event is fired.
    *
    * If the operation fails, the `error` event is fired, with `e.detail`
    * containing error information supplied from Firebase.
    *
    * @method changeEmail
    * @param {string} oldEmail
    * @param {string} newEmail
    * @param {string} Password
    */
    changeEmail: function(oldEmail, newEmail, password) {
      this.ref.changeEmail({
        oldEmail: oldEmail,
        newEmail: newEmail,
        password: password
      }, function(error) {
        if (!error) {
          this.fire('email-changed');
        } else {
          this.fire('error', error);
        }
      }.bind(this));
    },

    /**
     * Removes a "password provider"-based user account.
     *
     * If the operation is successful, the `user-removed` event is fired.
     *
     * If the operation fails, the `error` event is fired, with `e.detail`
     * containing error information supplied from Firebase.
     *
     * @method removeUser
     * @param {string} email
     * @param {string} password
     */
    removeUser: function(email, password) {
      this.ref.removeUser({email: email, password: password}, function(error, success) {
        if (!error) {
          this.fire('user-removed');
        } else {
          this.fire('error', error);
        }
      }.bind(this));
    }
  });
