/**
 * The purpose of this task is to run hourly, find locations where current time is just past midnight, grab all unchecked tasks
 * which are overdue in these locations, then send an alert to the users.
 * @author you
 * */



_ = lodash4; // get rid of old lodash, use latest one available on untrusted



/* TASK VARIABLES */

var DB_DATE_FORMAT = 'YYYY-MM-DD'; // official format for date field in db
var DEFAULT_TIMEZONE = 'America/New_York';
var GET_QUERY_API_LIMIT = 1000;
var TASK_OBJECT_API_KEY = 'tdd_task';
var TASK_OVERDUE_ALERT_API_KEY = 'task_overdue';

var apiUrl = '/v1/accounts/' + accountId + '/'; // account id is taken from task runner
var currentDay = moment();



/* TASK BODY */

async.waterfall(
  [
    fetchLocations,
    buildLocationsDueDateFilters,
    fetchOverDueTasks,
    generateAlertsForUsers
  ],
  function(error, alertsToSend) {

    if (error) {
      return defaultErrorHandler(error);
    }

    var alertErrors = [];

    return async.parallel(
      _.map(
        alertsToSend,
        function(alert) {
          return function(parentCallback) {
            // each alert unfortunately has to be sent separately
            // if you expect really a lot of alerts to be sent, you should consider different solution,
            // like for example sending alert per user, not per task
            return peach.alert(
              TASK_OVERDUE_ALERT_API_KEY,
              alert,
              function(error, result) {
                if (error) {
                  alertErrors.push(error);
                }
                return parentCallback();
              }
            );
          };
        }
      ),
      function(error) {

        if (error) {
          return defaultErrorHandler(error);
        }

        return defaultSuccessHandler(alertErrors);

      }
    );

  }
);



/* TASK HELPER FUNCTIONS */

function buildLocationsDueDateFilters(locations, parentCallback) {

  var locationsFilters = [];

  _.each(
    locations,
    function(location) {

      var locationCurrentDate = currentDay.clone().tz(
        _.get(location, 'timezone', DEFAULT_TIMEZONE)
      );

      // task will run every hour
      // if in this location current time is between midnight and 1AM (based on location timezone)
      // we can assume the date just has changed in this location, so we will look for overdue tasks in this location
      if (locationCurrentDate.get('h') <= 1) {

        locationsFilters.push({
          $and: [
            {due_date: {$lt: locationCurrentDate.format(DB_DATE_FORMAT)}},
            {location_id: location.id}
          ]
        });

      }

      return;

    }
  );

  return parentCallback(null, locationsFilters);

}

// This is a helper function - stringifies objects for api queries
function encodeFindParams(findParams) {
  return JSON.stringify(findParams);
}

function fetchLocations(parentCallback) {

  var url = apiUrl + 'locations';
  var queryParams = {
    fields: 'id,timezone',
    limit: GET_QUERY_API_LIMIT,
    sort: 'id'
  };

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
          return parentCallback(null, _.get(finalResponse, 'results', []));
        },
        parentCallback
      );

    }
  );

}

function fetchOverDueTasks(locationsFilters, parentCallback) {

  var url = apiUrl + TASK_OBJECT_API_KEY;
  var queryParams = {
    fields: 'id,assigned_user_id,due_date',
    limit: GET_QUERY_API_LIMIT,
    sort: 'id'
  };

  if (locationsFilters.length > 0) {

    queryParams.find = encodeFindParams({
      $and: [
        {is_complete: false}, // remember only to get tasks which were not checked
        {$or: locationsFilters}
      ]
    });

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
            return parentCallback(null, _.get(finalResponse, 'results', []));
          },
          parentCallback
        );

      }
    );

  } else {

    return parentCallback(null, []);

  }

}

function generateAlertsForUsers(overdueTasks, parentCallback) {

  var alerts = [];

  _.each(
    overdueTasks,
    function(task) {

      alerts.push({
        title: 'Overdue task',
        message: 'One of your tasks was due on ' + task.due_date + '.' +
          ' Please open the Todo app and complete it.',
        user_ids: [task.assigned_user_id]
      });

      return;

    }
  );

  return parentCallback(null, alerts);

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

/**
 * Default success hadler function
 * @param  {Object} data any kind of data passed in
 */
function defaultSuccessHandler(data) {
  done(null, data);
  return;
}

/**
 * Default error handler function
 * @param  {Object} error error object
 */
function defaultErrorHandler(error) {
  done(error);
  return;
}
