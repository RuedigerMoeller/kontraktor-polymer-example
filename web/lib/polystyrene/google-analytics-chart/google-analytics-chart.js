

  (function() {

    'use strict';

    Polymer({

      is: 'google-analytics-chart',

      properties: {

        /**
         * Sets the type of the chart.
         *
         * Should be one of:
         * - `area`, `bar`, `column`, `line`, `pie`, `geo`.
         *
         * @attribute type
         * @default 'area'
         * @type string
         */
        type: {
          type: String,
          value: 'area'
        },

        /**
         * Sets the width of the chart on the page.
         *
         * @attribute width
         * @default 480
         * @type number of string
         */
        width: {
          type: Number,
          value: 480
        },

        /**
         * Sets the height of the chart on the page.
         *
         * @attribute height
         * @default 320
         * @type number or string
         */
        height: {
          type: Number,
          value:  320,
        },

        /**
         * Sets the options for the chart.
         *
         * Example:
         * <pre>{
         *   title: "Chart title goes here",
         *   hAxis: {title: "Categories"},
         *   vAxis: {title: "Values", minValue: 0, maxValue: 2},
         *   legend: "none"
         * };</pre>
         * See <a href="https://google-developers.appspot.com/chart/interactive/docs/gallery">Google Visualization API reference (Chart Gallery)</a>
         * for the options available to each chart type.
         *
         * @attribute options
         * @default null
         * @type object
         */
        options: {
          type: Object,
          value: function() { return null; }
        },

        /**
         * True after the chart has been rendered for the first time.
         *
         * @attribute rendered
         * @type boolean
         */
        rendered: {
          type: Boolean,
          value: false,
          notify: true,
          reflectToAttribute: true
        },

        /**
         * True if the chart is currently loading data.
         *
         * @attribute loading
         * @type boolean
         */
        loading: {
          type: Boolean,
          value: false,
          notify: true,
          reflectToAttribute: true
        },

        /**
         * True if setup is ready
         *
         * @attribute setupReady
         * @type Boolean
         */
        setupReady: {
          type: Boolean,
          observer: 'setupReadyChanged'
        },

        /**
         * google-analytics-query passthrough properties
         * See google-analytics-query for documentation
         * startDate, endDate, data, ids, metrics, dimensions, sort, filters, segment, samplingLevel, startIndex, maxResults
         */
        startDate: {
          type: String,
        },

        endDate: {
          type: String
        },

        data: {
          type: Object
        },

        ids: {
          type: String
        },

        metrics: {
          type: String
        },

        dimensions: {
          type: String
        },

        sort: {
          type: String
        },

        filters: {
          type: String
        },

        segment: {
          type: String
        },

        samplingLevel: {
          type: String
        },

        startIndex: {
          type: Number
        },

        maxResults: {
          type: Number
        }

      },

      ready: function() {
        this._boundResponseHandler = this.handleResponse.bind(this);
        merge(this.$.chart.options, getChartOptions(this.type), this.options);
      },

      setupReadyChanged: function(newVal, oldVal) {
        if (newVal) {
          metadata.get();
        }
      },

      handleResponse: function(response) {
        this.rendered = true;

        metadata.get().then(function(map) {
          switchApiNamesToDisplayNames(response.dataTable, map);
          ensureProperDataTableTypes(response.dataTable);
          this.$.query.setData(response);
        }.bind(this));
      }
    });

    /**
     * @module metadata
     */
    var metadata = (function() {
      var promise;
      function queryMetadataAPI() {
        if (!gapi || !gapi.client || !gapi.client.analytics) {
          console.warn("Library not loaded yet!");
          return;
        }
        return new Promise(function(resolve, reject) {
          gapi.client.analytics
          gapi.client.analytics.metadata.columns
              .list({
                reportType: 'ga',
                _src: 'gwc-ga-chart'
              })
              .execute(function(response) {
                if (response.error) {
                  reject(response.error);
                }
                else {
                  var map = {};
                  response.items.forEach(function(item) {
                    map[item.id] = item.attributes.uiName;
                  });
                  resolve(map);
                }
              });
        });
      }
      return {
        /**
         * Return the `queryMetadataAPI` promise. If the promise exists,
         * return it to avoid multiple requests. If the promise does not
         * exist, initiate the request and cache the promise.
         */
        get: function() {
          promise = promise || queryMetadataAPI();
          return promise.catch(function(err) {
            console.error(err.stack || err);
          });
        }
      };
    }());

    /**
     * Return an options object for the specified chart type.
     * These are options suitable to pass to a Google Chart instance.
     * @return {Object} The chart options.
     */
    function getChartOptions(type) {
      var chartOptions = {
        base: {
          fontSize: 11,
          chartArea: {
            width: '100%'
          },
          legend: {
            position: 'top',
            alignment: 'start'
          }
        },
        area: {
          pointSize: 6,
          lineWidth: 4,
          areaOpacity: 0.1,
          colors: ['#058dc7', '#aadff3'],
          hAxis: {
            format: 'MMM d',
            gridlines: {
              color: 'transparent'
            },
            baselineColor: 'transparent'
          },
          vAxis: {
            gridlines: {
              color: '#e8e8e8',
              logScale: true,
              count: 3
            },
            textPosition: 'in'
          }
        },
        bar: {
          colors: ['#058dc7', '#50b432', '#ed561b'],
          hAxis: {
            gridlines: {
              color: '#e8e8e8'
            }
          },
          vAxis: {
            textPosition: 'in',
            textStyle: {
              strokeWidth: 4,
            }
          }
        },
        column: {
          colors: ['#058dc7', '#50b432', '#ed561b'],
          hAxis: {
            gridlines: {
              color: 'transparent'
            },
            baselineColor: 'transparent'
          },
          vAxis: {
            gridlines: {
              color: '#e8e8e8',
            },
            textPosition: 'in'
          },

        },
        geo: {
          colorAxis: {
            minValue: 0,
            colors: ['#aadff3', '#058dc7']
          }
        }
      };
      return merge({}, chartOptions.base, chartOptions[type]);
    }

    /**
     * Use data from the Metadata API to change api names
     * (e.g. `ga:sessions`) to their display names (e.g. "Sessions").
     * @param {Object} dataTable - The dataTable data.
     * @param {Object} map - A key/value store where the keys are the
     *   api names and the values are the display names.
     */
    function switchApiNamesToDisplayNames(dataTable, map) {
      dataTable.cols.forEach(function(col) {
        col.label = map[col.id] || col.label;
      });
    }

    /**
     * The analytics api erroneously return some values as strings that are
     * supposed to be numbers. This function fixes that.
     * @param {Object} dataTable - The dataTable data.
     */
    function ensureProperDataTableTypes(dataTable) {
      for (var i = 0; i < dataTable.rows.length; i++) {
        var row = dataTable.rows[i];
        for (var j = 0; j < row.c.length; j++) {
          if (dataTable.cols[j].type === 'number') {
            row.c[j].v = Number(row.c[j].v);
          }
        }
      }
    }

    /**
     * Merge the source objects, in order, onto the destination object.
     * Recursively merge nested, plain objects, everything else copy by
     * reference.
     * @param {Object} target - The object to receive the merged values.
     * @param {...Object} source - The object(s) to provide values to the
     *  target. Later sources override previous sources.
     * @return {Object} The merged target object.
     */
    function merge(target) {
      var sources = Array.prototype.slice.call(arguments, 1);
      sources.forEach(function(source) {
        // Only merge objects.
        if (!(source && typeof sources == 'object')) return;

        Object.keys(source).forEach(function(key) {
          // If the source's key is a 'plain' object, recursively merge.
          if (typeof source[key] == 'object' &&
              Object.getPrototypeOf(source[key]) == Object.prototype) {
            target[key] = target[key] == null ?
                merge({}, source[key]) : merge(target[key], source[key]);
          }
          // Otherwise just copy by reference.
          else if (typeof source[key] != 'undefined') {
            target[key] = source[key];
          }
        });
      });
      return target;
    }
  }());

