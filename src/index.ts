/* eslint-disable @typescript-eslint/no-explicit-any */
import { swaggerize, initialise, compile, json, ensureValid } from 'swagger-spec-express';
// var j2s = require('joi-to-swagger');
import j2s from 'joi-to-swagger';
import { setup, serve } from 'swagger-ui-express';
import responsesEnum from './responsesEnum';
import { isEmpty, map, get, has } from 'lodash';
import expressValidation from './validation/validate';
import { globSync } from 'glob';
import { Express } from 'express';

import { Path } from 'path-scurry';
import {
  addBodyParameter,
  addHeaderParameter,
  addModel,
  addPathParameter,
  addQueryParameter,
} from './swagger-spec/common';

/**
 * This module will support all the functionality of swagger-spec-express with additonal
 * functions of this module.
 * This module uses swagger-spec-express, swagger-ui-express and joi-to-swagger modules to
 * generate swagger documentation with joi validation.
 */

type PathInputs = {
  projectRoothPath: string;
  routeFolderName: string;
  requestModelFolderName: string;
  responseModelFolderName: string;
};

export = {
  swaggerize,
  createModel,
  serveSwagger,
  validation: expressValidation,
};

/**
 * This will create models for all the provides responses(with joi vlaidations).
 * @param {object} responseModel
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createResponseModel({ responseModel, name }: { responseModel: Record<string, any>; name: string }) {
  let isArray = false;
  if (responseModel && Array.isArray(responseModel) && responseModel.length) {
    isArray = true;
    responseModel = responseModel[0];
  }
  for (const property in responseModel) {
    if (typeof responseModel[property] === 'string') {
      responseModel[property] = {
        type: responseModel[property],
      };
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bodyParameter: any = {
    type: isArray ? 'array' : 'object',
  };

  if (isArray) {
    bodyParameter.items = {
      type: 'object',
      properties: responseModel,
    };
  } else {
    bodyParameter.properties = responseModel;
  }
  const model = Object.assign(
    {
      name,
    },
    bodyParameter
  );
  addModel(model, {
    validation: 'ignore',
  });
}

/**
 * Serve swagger for apis
 * @param app Express object
 * @param endPoint Swagger path on which swagger UI display
 * @param options Swagget Options.
 * @param path.routePath path to folder in which routes files defined.
 * @param path.requestModelPath path to folder in which requestModel defined.
 * @param path.responseModelPath path to folder in which responseModel defined.
 */
function serveSwagger(app: Express, endPoint: string, options: object, path: PathInputs) {
  describeSwagger(path);
  initialise(app, options);
  compile(); // compile swagger document
  app.use(endPoint, serve, setup(json()));
}

/**
 * This function will generate json for the success response.
 * @param {object} schema
 * @param {object} describe
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createResponses(schema: any, responseModel: Record<string, any>, describe: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const responses: Record<string, any> = {
    500: {
      description: responsesEnum[500],
    },
  };
  try {
    if (responseModel && !isEmpty(responseModel)) {
      for (const key in responseModel) {
        // eslint-disable-next-line no-prototype-builtins
        if (responseModel.hasOwnProperty(key)) {
          createResponseModel({
            responseModel: responseModel[key],
            name: `${schema.model}${key}ResponseModel`,
          });
          responses[key] = {
            description: responsesEnum[key] ? responsesEnum[key] : '',
            schema: {
              $ref: `#/definitions/${schema.model}${key}ResponseModel`,
            },
          };
        }
      }
    }
    describe.responses = responses;
    return describe;
  } catch (error) {
    console.log('Error while generting response model for swagger', error);
    describe.responses = responses;
    return describe;
  }
}

/**
 * This function will generate json given header parameter in schema(with joi validation).
 * @param {object} schema
 * @param {object} describe
 */

function getHeader(schema: any, describe: any) {
  const arr = [];
  for (const key in schema) {
    // eslint-disable-next-line no-prototype-builtins
    if (schema.hasOwnProperty(key)) {
      arr.push(key);
      const query = schema[key];
      const queryObject = {
        name: key,
        type: query.type ? query.type : query,
        required: query.required === 'undefined' ? false : true,
      };
      if (query._flags && query._flags.presence) {
        queryObject.required = query._flags.presence === 'required' ? true : false;
      }
      addHeaderParameter(queryObject);
    }
  }

  if (describe.common.parameters) {
    describe.common.parameters.header = arr;
  } else {
    describe.common.parameters = {};
    describe.common.parameters.header = arr;
  }

  return describe;
}

/**
 * This function will create models for given path and query schema and
 * convert it to json(with joi validation).
 * @param {object} schema
 * @param {string} value either query and path
 * @param {object} describe
 */

function getQueryAndPathParamObj(schema: any, value: string, describe: any, modelName: string) {
  const arr = [];
  for (const key in schema) {
    // eslint-disable-next-line no-prototype-builtins
    if (schema.hasOwnProperty(key)) {
      arr.push(`${key}-${modelName}`);
      const query = schema[key];

      const queryObject = {
        modelName,
        name: key,
        type: query.type ? query.type : query,
        required: query.required === 'undefined' ? false : true,
      };
      if (query._flags && query._flags.presence) {
        queryObject.required = query._flags.presence === 'required' ? true : false;
      }
      value === 'query'
        ? addQueryParameter(queryObject, {
            validation: 'ignore',
          })
        : addPathParameter(queryObject, {
            validation: 'ignore',
          });
    }
  }
  if (describe.common.parameters) {
    value === 'query' ? (describe.common.parameters.query = arr) : (describe.common.parameters.path = arr);
  } else {
    describe.common.parameters = {};
    value === 'query' ? (describe.common.parameters.query = arr) : (describe.common.parameters.path = arr);
  }

  return describe;
}

/**
 * This function will create models for given body schema
 * and convert it to json(with joi validation).
 * @param {object} schema
 * @param {object} describe
 */
function getBodyParameters(
  schema: { body: any; model: any; description: any },
  describe: { tags?: any[]; common: any }
) {
  const bodyParameter = j2s(schema.body).swagger;
  const model = Object.assign(
    {
      name: `${schema.model}Model`,
    },
    bodyParameter
  );
  addModel(model, {
    validation: 'ignore',
  });
  addBodyParameter(
    {
      name: `${schema.model}Model`,
      required: true,
      description: schema.description || undefined,
      schema: {
        $ref: `#/definitions/${schema.model}Model`,
      },
    },
    {
      validation: 'ignore',
    }
  );
  describe.common = {
    parameters: {
      body: [`${schema.model}Model`],
    },
  };
  return describe;
}

/**
 * This function will create proper schema based on given body, query, header and path parameter
 * mentioned in the schema.
 * @param {object} schema this is schema mentioned for each API in a route.
 */
function createModel(
  schema: any,
  responseModel: { [x: string]: any; hasOwnProperty: (arg0: string) => void },
  version: string
) {
  let tag = schema.group;
  if (version) {
    tag = `${tag}-${version}`;
  }
  let describe: any = {
    tags: [tag],
    common: {},
  };
  describe = {
    ...createResponses(schema, responseModel, describe),
  };
  if (schema && schema.body) {
    const bodyParams = getBodyParameters(schema, describe);
    describe = {
      ...bodyParams,
    };
  }
  if (schema && schema.query) {
    const queryParams = getQueryAndPathParamObj(schema.query, 'query', describe, schema.model);
    describe = {
      ...queryParams,
    };
  }

  if (schema && schema.path) {
    const pathParams = getQueryAndPathParamObj(schema.path, 'path', describe, schema.model);
    describe = {
      ...pathParams,
    };
  }

  if (schema && schema.header) {
    const headerParams = getHeader(schema.header, describe);
    describe = {
      ...headerParams,
    };
  }
  return describe;
}
/**
 *
 * @param routeFolderName : routh folder path.
 * @param requestModelFolderName : request model path
 * @param responseModelFolderName : responsemodel model path.
 */
function describeSwagger(path: PathInputs) {
  const { routeFolderName, responseModelFolderName, requestModelFolderName, projectRoothPath } = path;
  try {
    const routes: Array<Path> = <Array<Path>>globSync(`**/${routeFolderName}/**/*.js`, {
        ignore: ['index.js', '**/*.d.ts', '**/*.d.ts.map'],
        withFileTypes: true,
        cwd: projectRoothPath,
      }) || [];

    routes.forEach((file) => {
      try {
        if (!file) {
          console.log('No router file found in given folder');
          return;
        }
        let responseModel;
        let requestModel;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        let router = require(file.fullpath());
        const version = router.version;
        if (!router) {
          console.log('Router missing');
          return;
        }
        router = router.router || router;
        const requestModels = <Array<Path>>globSync(`**/${requestModelFolderName}/**/${file.name}`, {
            ignore: ['index.js', '**/*.d.ts', '**/*.d.ts.map'],
            withFileTypes: true,
            cwd: projectRoothPath,
          }) || [];

        const responseModels = <Array<Path>>globSync(`**/${responseModelFolderName}/**/${file.name}`, {
            ignore: ['index.js', '**/*.d.ts', '**/*.d.ts.map'],
            withFileTypes: true,
            cwd: projectRoothPath,
          }) || [];

        if (responseModels && responseModels[0]) {
          responseModel = require(responseModels[0].fullpath());
        } else {
          console.log('Response model  does not exist', file.name);
        }

        if (requestModels && requestModels[0]) {
          requestModel = require(requestModels[0].fullpath());
        } else {
          console.log('Request model path does not exist', file.name);
        }
        processRouter(router, requestModel, responseModel, file.name, version);
      } catch (error) {
        console.log(`Error in describeSwagger ${file.name}`);
      }
    });
  } catch (error) {
    console.log(`Error in describeSwagger ${error}`);
    return;
  }
}

function processRouter(item: any, requestModel: any, responseModel: any, routerName: string, version: string) {
  try {
    if (item.stack && item.stack.length > 0) {
      let count = 0;
      // tslint:disable-next-line:no-unused-expression
      map(item.stack, (route: any) => {
        let routeRequestModel = get(requestModel, [count]);
        const routeResposeModel = get(responseModel, get(routeRequestModel, ['model']));
        if (routeRequestModel && routeRequestModel.excludeFromSwagger) {
          count++;
          return;
        }
        if (!routeRequestModel || !has(routeRequestModel, 'group')) {
          routeRequestModel = {
            group: routerName,
            description: routerName,
          };
        }
        const data = Object.assign({}, createModel(routeRequestModel, routeResposeModel, version));
        describeRouterRoute(route, data);
        count++;
        return item;
      })[0];
    }
    if (item._router) {
      describeRouterRoute(item._router, requestModel);
      return item;
    }
  } catch (error) {
    console.log(`Error in processRouter ${error}`);
    return;
  }
}

function describeRouterRoute(router: any, metaData: any) {
  if (metaData.described) {
    console.warn('Route already described');
    return;
  }
  if (!metaData) {
    throw new Error('Metadata must be set when calling describe');
  }
  if (!router) {
    throw new Error(
      // tslint:disable-next-line:max-line-length
      'router was null, either the item that swaggerize & describe was called on is not an express app/router or you have called describe before adding at least one route'
    );
  }

  if (!router.route) {
    throw new Error(
      // tslint:disable-next-line:max-line-length
      'Unable to add swagger metadata to last route since the last item in the stack was not a route. Route name :' +
        router.route.name +
        '. Metadata :' +
        JSON.stringify(metaData)
    );
  }
  const verb = Object.keys(router.route.methods)[0];
  if (!verb) {
    throw new Error(
      // tslint:disable-next-line:max-line-length
      "Unable to add swagger metadata to last route since the last route's methods property was empty" +
        router.route.name +
        '. Metadata :' +
        JSON.stringify(metaData)
    );
  }
  ensureValid(metaData);
  ensureAtLeastOneResponse(metaData);
  metaData.path = router.route.path;
  metaData.verb = verb;
  router.route.swaggerData = metaData;
  metaData.described = true;
}

function ensureAtLeastOneResponse(metaData: any) {
  if (metaData.responses && Object.keys(metaData.responses).length > 0) {
    return;
  }
  if (metaData.common && metaData.common.responses.length > 0) {
    return;
  }
  throw new Error(
    // tslint:disable-next-line:max-line-length
    'Each metadata description for a route must have at least one response, either specified in metaData.responses or metaData.common.responses.'
  );
}
