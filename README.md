# express-joi-swagger-spec

This module helps you to generate swagger documentation for Express APIs using joy schema. You can also validate api request using this Module. This module convert your joy schema into json spec and disaply on swagger open UI

>[![Downloads](https://badgen.net/npm/dt/express-joi-swagger-spec)](https://www.npmjs.com/package/express-joi-swagger-spec) [![npm dependents](https://badgen.net/npm/dependents/express-joi-swagger-spec)](https://www.npmjs.com/package/express-joi-swagger-spec?activeTab=dependents)

## Description
This NPM module let's you validate and generate swagger (OpenAPI) documentation for your Express APIs without putting in much extra efforts. This module convert your joy schema into json spec and disaply on swagger open UI.

## Usage ##

Install using npm:

```bash
$ npm install --save express-joi-swagger-spec
```

### Express setup `app.js` ###

```javascript
const express = require("express");
const app = express();
const swagger = require("express-joi-swagger-spec");

// Define your router here

const options = {
	title: "express-joi-swagger-spec",
	version: "1.0.0",
	host: "localhost:3000",
	basePath: "/",
	schemes: ["http", "https"],
	securityDefinitions: {
		Bearer: {
			description: 'Example value:- Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU5MmQwMGJhNTJjYjJjM',
			type: 'apiKey',
			name: 'Authorization',
			in: 'header'
		}
	},
	security: [{Bearer: []}],
	defaultSecurity: 'Bearer'
};

/**
 * serveSwagger must be called after defining your router.
 * @param app Express object
 * @param endPoint Swagger path on which swagger UI display
 * @param options Swagget Options.
 * @param path.projectRoothPath project root path.
 * @param path.routeFolderName Directory name where all routes are placed.
 * @param path.requestModelFolderName Directory name where all joi schema are placed.
 * @param path.responseModelFolderName Directory name where responseModel is defined.
 */
swagger.serveSwagger(app, '/swagger', options, {
  projectRoothPath: __dirname,
  routeFolderName: 'routes',
  requestModelFolderName: 'RequestValidator',
  responseModelFolderName: 'ResponseModel',
});

```

### Express router `user.js` ###

```javascript

'use strict';
var express = require('express');
var router = express.Router();
var { validation } = require('express-joi-swagger-spec');
var userController = require('../controller/user');
var requestModel = require('../requestModel/users');

router.post('/', validation(requestModel[0]), userController.createUser);

router.get('/', userController.getUsers);

module.exports = { router, basePath: '/api/v1/users', version: 'v1' };

/**
 * Router can be exported in different ways. 
 * router is required, basePath & version are optional.
 * You can also export using below line
 * module.exports = router;
 * /

```

## Request Model `/requestModel/user.js`
  - Name of the request model file should be same as name of the router file.
  - Define request model with their order of apis in router js file. For example first api in user router is create user so you need to define createUser schema with key 0.
  - Add boolean flag "excludeFromSwagger" inside requestmodel if you want to exclude any particular api from swagger documentation.
  - This Request model follows Joi module conventions, so it can also be used for request parameters validation.

```javascript
const Joi = require("joi");
/**
 * File name for request model should be same as router file.
 * Define request model with there order in router js file.
 * For example first api in user router is create user so we define createUser schema with key 0.
 */
module.exports = {
    // Here 0 is the order of api in route file.
    0: {
        body: {
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            address: Joi.string().required(),
            contact: Joi.number().required()
        },
        model: "createUser", // Name of the model
        group: "User", // Swagger tag for apis.
        description: "Create user and save details in database"
    },
    1: {
        query: {},
        path: {}, // Define for api path param here.
        header: {}, // Define if header required.
        group: "User",
        description: "Get All User",
        excludeFromSwagger: false // Make it true if need to exclude apis from swagger.
    }
};
```

## Response Model `/responseModel/user.js`
 - Name of the response model file should be same as name of the router file.
 - Response name should be same as model name from requestmodel. For example model name of create user api is "createUser" so key for response object will be "createUser".
 - Inside response model define responses with respect to their status code returned from apis.

```javascript

// The name of each response payload should be model name defined in Request model schema.

module.exports = {
    createUser: {
        201: {
            message: {
                type: 'string'
            }
        },
        500: {
            internal: {
                type: 'string'
            }
        }
    },
    getUsers: {
        200: [{
            id: {
                type: 'number'
            },
            firstName: {
                type: 'string',
                pattern: '^\d{3}-\d{2}-\d{4}$'
            },
            lastName: {
                type: 'string'
            },
            address: {
                type: 'string'
            },
            contact: {
                type: 'number'
            },
            createdAt: {
                type: 'string',
                format: 'date-time'
            },
            updatedAt: {
                type: 'string',
                format: 'date-time'
            }
        }],
        500: {
            internal: "string"
        }
    }
};
```

Open `http://`<app_host>`:`<app_port>`/swagger` in your browser to view the documentation.

## Contributors
[Vikas Patidar](https://www.linkedin.com/in/vikas-patidar-0106/)
