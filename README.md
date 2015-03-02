# node_boilerplate
boilerplate repo for node projects. Contains the official jshint and jscs RC files, as well as a basic Gruntfile and package.json to get you started.

# Copying
Follow these steps to start a new project with this boilerplate.
1. Create a new empty repo on github, and copy the URL.
1. Clone **this** repo onto your machine.
1. cd into this repo on your machine.
1. Change the remote url to point to your new repo: `git remote set-url origin <paste url here>`.
1. Push to the new repo: git push -u origin master.
1. Be sure to modify package.json and this readme to reflect your project. 

## Linting
Two packages are used for linting: jscs and jshint.
The configuration for these linters can be found in `.jscs.json` and `.jshintrc`, respectively.
Run the linters with the following commands:
```
grunt jscs
grunt jshint
```

## Testing
Mocha is the test-runner of choice.
By default, the `grunt test` command will run all tests in the `test` directory that match the patter `*_test.js`.
Run your tests with the following command:

```
grunt test
```

## Grunt
Grunt is already set up to run tests and linting as shown above.
This boilerplate also comes pre-installed with **load-grunt-config** and **load-npm-tasks**.
To add a new grunt task from NPM, simply install it, and add the configuration in a `.js` file in `./grunt`.
For example, to add a browserify task, run `npm i --save-dev browserify` then add your browserify config in `grunt/browserify.js`.
Please look a the existing files in `grunt/browserify.js` for examples. Any custom tasks should also be defined in a file like `grunt/customTask.js`

Finally, you can run tests and linting with the following command:
```
grunt
```

## Config
This boilerplate comes with config already installed to aide in configuration management.
Use config in your project!
See index.js for an example.

## Contributing
Please submit any changes to this repo (including additions and subtractions from the lint config files) as pull requests. 

