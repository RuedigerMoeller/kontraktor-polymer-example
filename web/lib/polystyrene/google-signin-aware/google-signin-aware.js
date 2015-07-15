
  (function() {

    /**
     * Enum of attributes to be passed through to the login API call.
     * @readonly
     * @enum {string}
     */
    var ProxyLoginAttributes = {
      'appPackageName': 'apppackagename',
      'clientId': 'clientid',
      'cookiePolicy': 'cookiepolicy',
      'requestVisibleActions': 'requestvisibleactions'
    };

    /**
     * AuthEngine does all interactions with gapi.auth2
     *
     * It is tightly coupled with <google-signin-aware> element
     * The elements configure AuthEngine.
     * AuthEngine propagates all authentication events to all google-signin-aware elements
     *
     * API used: https://developers.google.com/identity/sign-in/web/reference
     *
     */
    var AuthEngine = {

      /**
       * oauth2 argument, set by google-signin-aware
       */
      _clientId: null,

      get clientId() {
        return this._clientId;
      },

      set clientId(val) {
        if (this._clientId && val && val != this._clientId) {
          throw new Error('clientId cannot change. Values do not match. New: ' + val + ' Old:' + this._clientId);
        }
        if (val) {
          this._clientId = val;
          this.initAuth2();
        }
      },

      /**
       * oauth2 argument, set by google-signin-aware
       */
      _cookiePolicy: 'single_host_origin',

      get cookiePolicy() {
        return this._cookiePolicy;
      },

      set cookiePolicy(val) {
        if (val) {
          this._cookiePolicy = val;
        }
      },

      /**
       * oauth2 argument, set by google-signin-aware
       */
      _appPackageName: '',

      get appPackageName() {
        return this._appPackageName;
      },

      set appPackageName(val) {
        if (this._appPackageName && val && val != this._appPackageName) {
          throw new Error('appPackageName cannot change. Values do not match. New: ' + val + ' Old: ' + this._appPackageName);
        }
        if (val) {
          this._appPackageName = val;
        }
      },

     /**
       * oauth2 argument, set by google-signin-aware
       */
      _requestVisibleActions: '',

      get requestVisibleactions() {
        return this._requestVisibleActions;
      },

      set requestVisibleactions(val) {
        if (this._requestVisibleActions && val && val != this._requestVisibleActions) {
          throw new Error('requestVisibleactions cannot change. Values do not match. New: ' + val + ' Old: ' + this._requestVisibleActions);
        }
        if (val)
          this._requestVisibleActions = val;
      },

      /** <google-js-api> */
      _apiLoader: null,

      /** an array of wanted scopes. oauth2 argument */
      _requestedScopeArray: [],

      /** _requestedScopeArray as string */
      get requestedScopes() {
        return this._requestedScopeArray.join(' ');
      },

      /** Is user signed in? */
      _signedIn: false,

      /** Currently granted scopes */
      _grantedScopeArray: [],

      /** True if additional authorization is required */
      _needAdditionalAuth: true,

      /** True if have google+ scopes */
      _hasPlusScopes: false,

      /**
       * array of <google-signin-aware>
       * state changes are broadcast to them
       */
      signinAwares: [],

      init: function() {
        this._apiLoader = document.createElement('google-js-api');
        this._apiLoader.addEventListener('js-api-load', this.loadAuth2.bind(this));
      },

      loadAuth2: function() {
        gapi.load('auth2', this.initAuth2.bind(this));
      },

      initAuth2: function() {
        if (!('gapi' in window) || !('auth2' in window.gapi) || !this.clientId) {
          return;
        }
        var auth = gapi.auth2.init({
          'client_id': this.clientId,
          'cookie_policy': this.cookiePolicy,
          'scope': this.requestedScopes
        });

        auth.currentUser.listen(this.handleUserUpdate.bind(this));

        auth.then(
          function success() {
          // Let the current user listener trigger the changes.
          },
          function error(error) {
            console.error(error);
          }
        );
      },

      handleUserUpdate: function(newPrimaryUser) {
        // update and broadcast currentUser
        var isSignedIn = newPrimaryUser.isSignedIn();
        if (isSignedIn != this._signedIn) {
          this._signedIn = isSignedIn;
          for (var i=0; i<this.signinAwares.length; i++) {
            this.signinAwares[i]._setSignedIn(isSignedIn);
          }
        }

        // update granted scopes
        this._grantedScopeArray = this.strToScopeArray(
          newPrimaryUser.getGrantedScopes());
        // console.log(this._grantedScopeArray);
        this.updateAdditionalAuth();

        var response = newPrimaryUser.getAuthResponse();
        for (var i=0; i<this.signinAwares.length; i++) {
          this.signinAwares[i]._updateScopeStatus(response);
        }
      },

      /** convert scope string to scope array */
      strToScopeArray: function(str) {
        if (!str) {
          return [];
        }
        // remove extra spaces, then split
        var scopes = str.replace(/\ +/g, ' ').trim().split(' ');
        for (var i=0; i<scopes.length; i++) {
          scopes[i] = scopes[i].toLowerCase();
           // Handle scopes that will be deprecated but are still returned with their old value
          if (scopes[i] === 'https://www.googleapis.com/auth/userinfo.profile') {
            scopes[i] = 'profile';
          }
          if (scopes[i] === 'https://www.googleapis.com/auth/userinfo.email') {
            scopes[i] = 'email';
          }
        }
        // return with duplicates filtered out
        return scopes.filter( function(value, index, self) {
          return self.indexOf(value) === index;
        });
      },

      /** true if scopes have google+ scopes */
      isPlusScope: function(scope) {
        return (scope.indexOf('/auth/games') > -1)
            || (scope.indexOf('auth/plus.') > -1 && scope.indexOf('auth/plus.me') < 0);
      },

      /** true if scopes have been granted */
      hasGrantedScopes: function(scopeStr) {
        var scopes = this.strToScopeArray(scopeStr);
        for (var i=0; i< scopes.length; i++) {
          if (this._grantedScopeArray.indexOf(scopes[i]) === -1)
            return false;
        }
        return true;
      },

      /** request additional scopes */
      requestScopes: function(newScopeStr) {
        var newScopes = this.strToScopeArray(newScopeStr);
        var scopesUpdated = false;
        for (var i=0; i<newScopes.length; i++) {
          if (this._requestedScopeArray.indexOf(newScopes[i]) === -1) {
            this._requestedScopeArray.push(newScopes[i]);
            scopesUpdated = true;
          }
        }
        if (scopesUpdated) {
          this.updateAdditionalAuth();
          this.updatePlusScopes();
        }
      },

      /** update status of _needAdditionalAuth */
      updateAdditionalAuth: function() {
        var needMoreAuth = false;
        for (var i=0; i<this._requestedScopeArray.length; i++) {
          if (this._grantedScopeArray.indexOf(this._requestedScopeArray[i]) === -1) {
            needMoreAuth = true;
            break;
          }
        }
        if (this._needAdditionalAuth != needMoreAuth) {
          this._needAdditionalAuth = needMoreAuth;
          // broadcast new value
          for (var i=0; i<this.signinAwares.length; i++) {
            this.signinAwares[i]._setNeedAdditionalAuth(needMoreAuth);
          }
        }
      },

      updatePlusScopes: function() {
        var hasPlusScopes = false;
        for (var i = 0; i < this._requestedScopeArray.length; i++) {
          if (this.isPlusScope(this._requestedScopeArray[i])) {
            hasPlusScopes = true;
            break;
          }
        }
        if (this._hasPlusScopes != hasPlusScopes) {
          this._hasPlusScopes = hasPlusScopes;
          for (var i=0; i<this.signinAwares.length; i++) {
            this.signinAwares[i]._setHasPlusScopes(hasPlusScopes);
          }
        }
      },
      /**
       * attached <google-signin-aware>
       * @param {<google-signin-aware>} aware element to add
       */
      attachSigninAware: function(aware) {
        if (this.signinAwares.indexOf(aware) == -1) {
          this.signinAwares.push(aware);
          // Initialize aware properties
          aware._setNeedAdditionalAuth(this._needAdditionalAuth);
          aware._setSignedIn(this._signedIn);
          aware._setHasPlusScopes(this._hasPlusScopes);
        } else {
          console.warn('signinAware attached more than once', aware);
        }
      },

      detachSigninAware: function(aware) {
        var index = this.signinAwares.indexOf(aware);
        if (index != -1) {
          this.signinAwares.splice(index, 1);
        } else {
          console.warn('Trying to detach unattached signin-aware');
        }
      },

      /** returns scopes not granted */
      getMissingScopes: function() {
        return this._requestedScopeArray.filter( function(scope) {
          return this._grantedScopeArray.indexOf(scope) === -1;
        }.bind(this)).join(' ');
      },

      assertAuthInitialized: function() {
        if (!this.clientId) {
          throw new Error("AuthEngine not initialized. clientId has not been configured.");
        }
        if (!('gapi' in window)) {
          throw new Error("AuthEngine not initialized. gapi has not loaded.");
        }
        if (!('auth2' in window.gapi)) {
          throw new Error("AuthEngine not initialized. auth2 not loaded.");
        }
      },

      /** pops up sign-in dialog */
      signIn: function() {
        this.assertAuthInitialized();
        var params = {
          'scope': this.getMissingScopes()
        };

        // Proxy specific attributes through to the signIn options.
        Object.keys(ProxyLoginAttributes).forEach(function(key) {
          if (this[key] && this[key] !== '') {
            params[ProxyLoginAttributes[key]] = this[key];
          }
        }, this);

        var promise;
        var user = gapi.auth2.getAuthInstance().currentUser.get();
        if (user.getGrantedScopes()) {
          // additional auth, skip multiple account dialog
          promise = user.grant(params);
        } else {
          // initial signin
          promise = gapi.auth2.getAuthInstance().signIn(params);
        }
        promise.then(
          function success(newUser) {
            var authResponse = newUser.getAuthResponse();
            // Let the current user listener trigger the changes.
          },
          function error(error) {
            if ("Access denied." == error.reason) {
              // Access denied is not an error, user hit cancel
              return;
            } else {
              console.error(error);
            }
          }
        );
      },

      /** signs user out */
      signOut: function() {
        this.assertAuthInitialized();
        gapi.auth2.getAuthInstance().signOut().then(
          function success() {
          // Let the current user listener trigger the changes.
          },
          function error(error) {
            console.error(error);
          }
        );
      }
    };

    AuthEngine.init();

/**
`google-signin-aware` is used to enable authentication in custom elements by
interacting with a google-signin element that needs to be present somewhere
on the page.

The `scopes` attribute allows you to specify which scope permissions are required
(e.g do you want to allow interaction with the Google Drive API).

The `google-signin-aware-success` event is triggered when a user successfully
authenticates. The `google-signin-aware-signed-out` event is triggered
when a user explicitely signs out via the google-signin element.

You can bind to `isAuthorized` property to monitor authorization state.
##### Example

    <google-signin-aware scopes="https://www.googleapis.com/auth/drive"></google-signin-aware>
*/
    Polymer({

      is: 'google-signin-aware',

      /**
       * Fired when this scope has been authorized
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
          observer: '_appPackageNameChanged'
        },
        /**
         * a Google Developers clientId reference
         */
        clientId: {
          type: String,
          observer: '_clientIdChanged'
        },

        /**
         * The cookie policy defines what URIs have access to the session cookie
         * remembering the user's sign-in state.
         * See the relevant [docs](https://developers.google.com/+/web/signin/reference#determining_a_value_for_cookie_policy) for more information.
         * @default 'single_host_origin'
         */
        cookiePolicy: {
          type: String,
          observer: '_cookiePolicyChanged'
        },

        /**
         * The app activity types you want to write on behalf of the user
         * (e.g http://schemas.google.com/AddActivity)
         *
         */
        requestVisibleActions: {
          type: String,
          observer: '_requestVisibleActionsChanged'
        },

       /**
         * The scopes to provide access to (e.g https://www.googleapis.com/auth/drive)
         * and should be space-delimited.
         */
        scopes: {
          type: String,
          value: 'profile',
          observer: '_scopesChanged'
        },

        /**
         * True if user is signed in
         */
        signedIn: {
          type: Boolean,
          notify: true,
          readOnly: true
        },

        /**
         * True if authorizations for *this* element have been granted
         */
        isAuthorized: {
          type: Boolean,
          notify: true,
          readOnly: true,
          value: false
        },

        /**
         * True if additional authorizations for *any* element are required
         */
        needAdditionalAuth: {
          type: Boolean,
          notify: true,
          readOnly: true
        },

        /**
         * True if *any* element has google+ scopes
         */
        hasPlusScopes: {
          type: Boolean,
          value: false,
          notify: true,
          readOnly: true
        }
      },

      attached: function() {
        AuthEngine.attachSigninAware(this);
      },

      detached: function() {
        AuthEngine.detachSigninAware(this);
      },

      /** pops up the authorization dialog */
      signIn: function() {
        AuthEngine.signIn();
      },

      /** signs user out */
      signOut: function() {
        AuthEngine.signOut();
      },

      _appPackageNameChanged: function(newName, oldName) {
        AuthEngine.appPackageName = newName;
      },

      _clientIdChanged: function(newId, oldId) {
        AuthEngine.clientId = newId;
      },

      _cookiePolicyChanged: function(newPolicy, oldPolicy) {
        AuthEngine.cookiePolicy = newPolicy;
      },

      _requestVisibleActionsChanged: function(newVal, oldVal) {
        AuthEngine.requestVisibleActions = newVal;
      },

      _scopesChanged: function(newVal, oldVal) {
        AuthEngine.requestScopes(newVal);
        this._updateScopeStatus();
      },

      _updateScopeStatus: function(user) {
        var newAuthorized = this.signedIn && AuthEngine.hasGrantedScopes(this.scopes);
        if (newAuthorized !== this.isAuthorized) {
          this._setIsAuthorized(newAuthorized);
          if (newAuthorized) {
            this.fire('google-signin-aware-success', user);
          }
          else {
            this.fire('google-signin-aware-signed-out', user);
          }
        }
      }
    });
  })();
