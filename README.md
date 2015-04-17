









# bookshelf-shield
Form a protective shield around your bookshelf models.
This module leverages two other great modules (bookshelf-authorization and relations) to add ACL-based authorization to bookshelf models. 

### bookshelf-authorization
Adds an `authorize` method to bookshelf models, and creates a special **User** model.
This allows you to specify when a user is authorized to perform an action on a model.

### relations
Provides an intuitive interface for storing and querying Access Conrtol Lists.
Relations is used to determine whether a user has been granted access to perform an action on the model.

# Usage
This module must be included and initialized before any of your models are extended from bookshelf.Model.
There are three steps to setting up bookshelf-shield:
1. include and initialize
1. create all model-constructors by extending `bookshelf.model`
1. **shields up!** override access methods on models so that authorization takes place when access is requested.


bookshelf shield overrides native methods like fetch, fetchAll and save, and replaces them with secure versions.


var Study = new bookshelf.Model.extend({tableName: 'mrs_studies'});

bookshelfShield.wrap(Study);

var myStudy = Study.forge({study_id: 1234}).fetch(user);






