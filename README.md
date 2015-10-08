![Shield](http://media.moddb.com/images/articles/1/136/135611/auto/OldBatteredVikingShieldTwo_zpsd566f8c8.png)

# bookshelf-shield
Form a protective shield around your bookshelf models.
This module adds ACL-based authorization, and a CRUD API to bookshelf models.

[ ![Codeship Status for MRN-Code/bookshelf-shield](https://codeship.com/projects/5003acd0-c992-0132-5525-0aefb56b1e0b/status?branch=master)](https://codeship.com/projects/75267)

# Dependencies
### relations
As of right now, bookshelf-shield only can interact with the ACL module called [relations](https://github.com/carlos8f/node-relations)
Provides an intuitive interface for storing and querying Access Conrtol Lists.
Relations is used to determine whether a user has been granted access to perform an action on the model.

### ES6
This module utilizes ES6 features, including classes, arrow functions and Promises. As a result, the code is [Babel](https://babeljs.io)ified to be compatible with all versions of node.

# Usage
1. Set up your ACL
```js
relations.define('study', {
    PI: ['read_Study'],
    siteAdmin: [
        'read_Study',
        'update_Study',
        'create_Study',
        'delete_Study'
    ]
});
```
1. Set up you bookshelf models
```js
const models = {
    Study: bookshelf.Model.extend({tableName: 'mrs_studies'}),
    //...
};
```
1. Create a shieldConfig for each model (see configuration section for more)
```js
const config = [
    {
        defaults: {
            modelName: 'Study',
            authKey: 'id',
            aclContextName: 'study'
        },
        //optional action-specific configs here
    },
    //...
```
1. Shields up!
```js
const shield = require('bookshelf-shield);
shield({
    config: config,
    acl: relations,
    models: models
});
```

# API
Once a model has been shielded, you can interact with it using a standard CRUD API, rather than the traditional `fetch, save, destroy` bookshelf API. This was implemented to more easily map to user's permissions.

1. create
```js
    const user = { username: 'dylan' };
    const widget = new Widget({ color: 'blue' });
    widget.create(user).then((newWidget) => {
        //new Widget successfully created
    }).catch((error) => {
        //handle Error
    });
```
1. read
```js
    const user = { username: 'dylan' };
    const widget = new Widget({ id: '101' });
    widget.read(user).then((newWidget) => {
        //newWidget successfully read
    }).catch((error) => {
        //handle Error
    });
```
1. readAll
```js
    const user = { username: 'dylan' };
    const widget = new Widget();
    widget.query({color: 'blue'});
    widget.readAll(user).then((newWidgets) => {
        //widgets successfully read into newWidgets collection
    }).catch((error) => {
        //handle Error
    });
```
1. update (note: by default, read access is required to perform an update)
```js
    const user = { username: 'dylan' };
    widget.set('color', 'red');
    widget.update(user).then((newWidget) => {
        //widget successfully updated
    }).catch((error) => {
        //handle Error
    });
```
1. delete (note: by default, read access is required to perform a delete)
```js
    const user = { username: 'dylan' };
    const widget = new Widget({ id: '101' });
    widget.delete(user).then((newWidget) => {
        //widgets successfully deleted (newWidget should now be empty)
    }).catch((error) => {
        //handle Error
    });
```

# Configuration
Each model to be shielded requires a config object. During initialization, these config objects should be provided as an array. Here is an example config object:
```js
module.exports = {
    defaults: { // These defaults will be applied to all CRUD access methods, unless overridden below.
        modelName: 'Study', // The name of the model: must match the key associated with the model in the models object passed to shield init.
        authKey: 'id', // The property that should be used for authorization.
        aclContextName: 'study' // The name of the ACL (relations) context to be used
    },
    create: { //specifying any CRUD method allows you to override the defaults secified above
        authKey: 'siteId', //alternative auth key to be used when evaluating create access
        aclContextName: 'site',
        method: function validateSiteAdmin(user) {
            // this is a cusom authentication method that will be invoked instead of the generic method.
            // `this` refers to the current instance of the bookshelf model
            const siteId = this.get('siteId');
            // data stored on the shield can be accessed through the current object's constructor (the bookshelf Model).
            const Model = this.constructor;
            const aclContext = Model.shield.acl.site;
            const aclQuestion = 'can ' +
                user.username +
                ' create_Study from ' +
                siteId;

            if (!siteId) {
                return Promise.reject(
                    new Error('Study has no valide siteId')
                );
            }

            return aclContext(aclQuestion).then(function checkAuth(allow) {
                let errorMsg;
                if (allow) {
                    return allow;
                }

                errorMsg =
                    user.username +
                    ' cannot create studies in Site ' +
                    siteId;
                throw new Error(errorMsg);
            });
        }
    }
};

```
Because there are no configuration objects specified for `read`, `update` and `delete` operations, those operations will be protected using the generic method (see below).

# Generic Auth Method
Unless a custom method is specified in the Model's config, the following generic method will be applied:
```js
// Note options is the config for the current Model and action
function genericAuthMethod(user) {
    const authVal = this.get(options.authKey);
    const aclQuestion = 'can ' +
        user.username +
        ' ' +
        permissionName +
        ' from ' +
        authVal;
    const aclContext = options.acl[aclContextName];

    //TODO: optimize to cache perms instead of loading from redis
    return aclContext(aclQuestion).then(function checkAuth(allow) {
        let errorMsg;
        if (allow) {
            return allow;
        }

        errorMsg = [
            user.username,
            'cannot',
            permissionName.replace('_', ' '),
            'in',
            options.authKey,
            '`' + authVal + '`'
        ].join(' ');
        throw new AuthError(errorMsg);
    });
```

# Examples
See `test/integration/main.js` for a full example

# Tests
Fully unit and integration tested

# Contributing
Please follow the MRN Javascript Style Guide (forked from AirBnB). Use `grunt lint` to check yo-self
