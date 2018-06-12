/**
 * This trigger will ensure that non-admins will only be able to change status of their own tasks
 * @author you
 * */
 
 

_ = lodash4; // get rid of old lodash, use latest one available on untrusted



/* TRIGGER VARIABLES */

var APP_API_KEY = req.app_key;
var ADMIN_PERMISSION_API_KEY = 'todo_admin';
var GET_QUERY_API_LIMIT = 1000;
var TASK_OBJECT_API_KEY = 'tdd_task';

var apiUrl = '/v1/accounts/' + req.account_id + '/'; // account id is taken from trigger runner
var collection = _.get(req, ['body', 'collection'], []);
var filters = _.get(req, ['query', 'find'], {});
var userPermissions = _.get(req, ['permissions', APP_API_KEY], []);



/* TRIGGER BODY */

if (
  !req.is_developer &&
  (
    _.isEmpty(userPermissions) ||
    userPermissions.indexOf(ADMIN_PERMISSION_API_KEY) === -1
  )
) {

  try {

    if (_.isString(filters)) {

      filters = JSON.parse(filters);
        
      filters = {
        $and: [
          filters,
          {assigned_user_id: req.user_id}
        ]
      };

      defaultSuccessHandler({
        query: _.extend({}, req.query, {find: JSON.stringify(filters)}),
        body: _.pick(req.body, ['is_complete'])
      });

    } else if (!_.isEmpty(collection)) {

      var parsedCollection = [];

      preloadTasks(
        _.map(collection, 'id'),
        function(preloadedTasks) {

          _.each(
            preloadedTasks,
            function(task) {

              if (task.assigned_user_id === req.user_id) {
                parsedCollection.push(
                  _.pick(
                    _.find(collection, {id: task.id}),
                    ['id', 'is_complete']
                  )
                );
              }

              return;

            }
          );

          defaultSuccessHandler({
            body: _.extend({}, req.body, {collection: parsedCollection})
          });

        }
      );

    } else {

      if (_.get(req, ['body', 'is_complete'], null) === null) {

        defaultErrorHandler("You can only change the status of the assigned task.");

      } else {

        preloadTasks(
          [_.get(req, ['params', 'id'], 0)],
          function(preloadedTasks) {

            if (preloadedTasks.length === 0 || preloadedTasks[0]['assigned_user_id'] !== req.user_id) {
              
              defaultErrorHandler("You can't edit this task, it is not assigned to you.");
              
            } else {

              defaultSuccessHandler({
                body: _.extend(
                  _.omit(
                    preloadedTasks[0],
                    ['id', 'assigned_user_id']
                  ),
                  {is_complete: req.body.is_complete}
                )
              });

            }

          }
        );

      }

    }

  } catch (ex) {

    defaultErrorHandler(ex);

  }

} else {

  defaultSuccessHandler();
  
}



/* TRIGGER HELPER FUNCTIONS */

function encodeFindParams(findParams) {
  return JSON.stringify(findParams);
}

function logData(message, extendedData) {

  if (!_.isUndefined(extendedData)) {
    peach.log(message, extendedData);
  } else {
    peach.log(message);
  }

  return;

}

function handleBigResultSetHelper(initialResponse, url, params, success, error) {

  var totalResults    = [];
  var pagesToLoad     = Math.ceil(initialResponse.count / GET_QUERY_API_LIMIT);
  var successCallback = success || defaultSuccessHandler;
  var errorCallback   = error || defaultErrorHandler;

  return async.series(
    _.map(
      _.range(2, pagesToLoad + 1, 1), // skip first page, we already got this results in initialResponse.results
      function(pageNo) {
        return function(callback) {

          var newParams = _.clone(params);
              newParams.page = pageNo;

          return peach.get(
            url,
            newParams,
            function(error, response) {
              if (error) {
                return callback(error);
              } else {
                return callback(null, response.results);
              }
            }
          );

        };
      }
    ),
    function(error, results) {

      if (error) {

        return errorCallback(error);

      } else {

        totalResults = totalResults.concat(initialResponse.results);

        _.each(
          results,
          function(resultSet) {
            totalResults = totalResults.concat(resultSet);
            return;
          }
        );

        return successCallback(totalResults);

      }

    }
  );

}

// This function is called as a callback for peach.get
// it checks if there are more than GET_QUERY_API_LIMIT results in the request result set
// and automatically loads all the results it didnt get in the first reuqest using handleBigResultSetHelper
function handlePeachGetRespose(error, response, url, queryParams, successCb, errorCb) {

  var successCallback = successCb || defaultSuccessHandler;
  var errorCallback   = errorCb || defaultErrorHandler;

  if (error) {

    return errorCallback(error);

  } else {

    if (response.count > GET_QUERY_API_LIMIT) {

      return handleBigResultSetHelper(
        response,
        url,
        queryParams,
        function(results) {

          response.results = results;
          return successCallback(response);

        },
        errorCallback
      );

    } else {

      return successCallback(response);

    }

  }

}

function preloadTasks(ids, parentCallback) {

  var url = apiUrl + TASK_OBJECT_API_KEY;
  var queryParams = {
    fields: 'id,assigned_user_id,description,due_date,is_complete,location_id',
    find: encodeFindParams({id: ids}),
    limit: GET_QUERY_API_LIMIT,
    sort: 'id'
  };

  if (ids.length > 0) {

    return peach.get(
      url,
      queryParams,
      function(error, response) {
        // if there will be more than GET_QUERY_API_LIMIT results returned, we need to make additional calls to load
        // all the pages with the data - handlePeachGetRespose is the function we have created for that
        return handlePeachGetRespose(
          error,
          response,
          url,
          queryParams,
          function(finalResponse) {
            return parentCallback(_.get(finalResponse, 'results', []));
          },
          function(error) {
            return defaultErrorHandler(error);
          }
        );

      }
    );

  } else {

    return parentCallback([]);

  }

}

/**
 * Default success hadler function
 * @param  {Object} [data] any kind of data passed in - optional
 */
function defaultSuccessHandler(data) {

  if (data) {
    done(null, data);
  } else {
    done();
  }

  return;

}

/**
 * Default error handler function
 * @param  {Object} error error object
 */
function defaultErrorHandler(error) {

  logData(TASK_OBJECT_API_KEY + ' BEFORE PUT trigger error', error);
  done(error);

  return;

}
