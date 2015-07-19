# &lt;fork-me-on-github&gt;

> A Fork Me On Github ribbon custom element using [Polymer](http://www.polymer-project.org/).

## Demo

[Check it live!](http://tcyrus.github.io/fork-me-on-github)

## Install

Install the component using [Bower](http://bower.io/):

```sh
$ bower install polymer-fork-me-on-github --save
```

Or [download as ZIP](https://github.com/tcyrus/fork-me-on-github/archive/master.zip).

## Usage

1. Import polyfill:

    ```html
    <script src="bower_components/webcomponentsjs/webcomponents-lite.min.js"></script>
    ```

2. Import custom element:

    ```html
    <link rel="import" href="bower_components/polymer-fork-me-on-github/fork-me-on-github.html">
    ```

3. Start using it!

    ```html
    <fork-me-on-github></fork-me-on-github>
    ```

## Options

Attribute     | Options     | Default                    | Description
---           | ---         | ---                        | ---
`repo`        | *string*    | `tcyrus/fork-me-on-github` | Ribbon Repo.
`align`       | *string*    | `left`                     | Ribbon Align.
`color`       | *string*    | `red`                      | Ribbon Color.


## Development

In order to run it locally you'll need to fetch some dependencies and a basic server setup.

1. Install [bower](http://bower.io/) & [polyserve](https://npmjs.com/polyserve):

    ```sh
    $ npm install -g bower polyserve
    ```

2. Install local dependencies:

    ```sh
    $ bower install
    ```

3. Start development server and open `http://localhost:8080/components/fork-me-on-github/`.

    ```sh
    $ polyserve
    ```

## History

For detailed changelog, check [Releases](https://github.com/my-user/fork-me-on-github/releases).

## License

[MIT License](http://opensource.org/licenses/MIT)
