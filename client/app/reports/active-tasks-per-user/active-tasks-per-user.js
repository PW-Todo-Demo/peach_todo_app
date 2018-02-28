/**
 * TODO app active tasks per user report
 * Shows completed/uncompleted tasks per user.
 * This coded report makes 2 sepearate PAQL queries to load data, and then combines their results altogether with data
 * from another (regular) api call (loading user names).
 * @author you
 */



/* Variables */

_ = lodash4; // by default reports runner uses some old version of lodash, use latest one available in report runner instead


// NOTE: Report runner can only run ES5 code
var REPORT_PARAMS       = params || null; // params taken from reports runner
var GET_QUERY_API_LIMIT = 1000; // peach api allows returning max 1000 entries for objects in each api call (PAQL doesnt have this restriction) 
var API_URL             = '/v1/accounts/' + accountId; // accountId is taken from reports runner
var TASK_OBJECT_API_KEY = 'tdd_task'; // api key for task object

// let's specify some column names - for the queries we will use to load data, but we will also use the same names in the final output
var USER_ID_COLUMN_NAME            = 'User ID';
var USER_NAME_COLUMN_NAME          = 'User Name';
var COMPLETED_TASKS_COLUMN_NAME    = 'Tasks Completed';
var ACTIVE_TASKS_COLUMN_NAME       = 'Active Tasks';
var COMPLETION_PERCENT_COLUMN_NAME = '% Completed';

// parts of the first PAQL query which we will use to load completed tasks data per user id
var FIRST_PAQL_QUERY_SELECT = '' +
  "SELECT " +
    "COUNT(" + TASK_OBJECT_API_KEY + ".id) AS '" + COMPLETED_TASKS_COLUMN_NAME + "' ";
var FIRST_PAQL_QUERY_BY = '' +
  "BY " +
    TASK_OBJECT_API_KEY + ".assigned_user_id AS '" + USER_ID_COLUMN_NAME + "' ";
var FIRST_PAQL_QUERY_WHERE = '' +
  "WHERE " +
    TASK_OBJECT_API_KEY + ".is_complete = 'true' ";
var FIRST_PAQL_QUERY_ORDER_BY = '' +
  "ORDER BY " +
    "'" + COMPLETED_TASKS_COLUMN_NAME + "' ";

// parts of the second PAQL query which we will use to load active (uncompleted) tasks data per user id
var SECOND_PAQL_QUERY_SELECT = '' +
  "SELECT " +
    "COUNT(" + TASK_OBJECT_API_KEY + ".id) AS '" + ACTIVE_TASKS_COLUMN_NAME + "' ";
var SECOND_PAQL_QUERY_BY = '' +
  "BY " +
    TASK_OBJECT_API_KEY + ".assigned_user_id AS '" + USER_ID_COLUMN_NAME + "' ";
var SECOND_PAQL_QUERY_WHERE = '' +
  "WHERE " +
    TASK_OBJECT_API_KEY + ".is_complete = 'false' ";
var SECOND_PAQL_QUERY_ORDER_BY = '' +
  "ORDER BY " +
    "'" + ACTIVE_TASKS_COLUMN_NAME + "' ";

// some local variables we will use in the report
var exactDateFromReportParams   = null; // single date parsed from input params in loadDataAndCombineResults function
var startDateFromReportParams   = null; // start date of date range parsed from input params in loadDataAndCombineResults function
var endDateFromReportParams     = null; // end date of date range parsed from input params in loadDataAndCombineResults function
var locationIdsFromReportParams = []; // ids of locations parsed from input params in loadDataAndCombineResults function
var firstQueryPaqlResults       = []; // raw results of first PAQL query
var firstQueryPaqlColumns       = []; // columns returned along with results of first PAQL query
var secondQueryPaqlResults      = []; // raw results of second PAQL query
var secondQueryPaqlColumns      = []; // columns returned along with results of second PAQL query
var userIdsFromPAQLResults      = []; // array of unique user ids which will be parsed out of the PAQL queries results
var usersById                   = {}; // map of users loaded from api based on userIdsFromPAQLResults



/* RUN MAIN FUNCTION */

// here the report code is ran
loadDataAndCombineResults();



/* Functions - local functions used in this report */

// Function which will load results of the first PAQL query, accepts two callbacks
function fetchFirstQueryPAQLResults(successCb, errorCb) {

  var successCallback = successCb || reportSuccessCallback;
  var errorCallback   = errorCb || reportErrorCallback;
  var url             = API_URL + '/waql'; // api endpoint for executing PAQL queries
  var paqlQuery       = '';

  // update WHERE with report input params
  // in basic reports this is done automatically, in coded report developer should parse input params himself
  // and remember to use them in any data requests he makes in the report
  FIRST_PAQL_QUERY_WHERE = FIRST_PAQL_QUERY_WHERE +
    (exactDateFromReportParams ? 'AND ' + TASK_OBJECT_API_KEY + '.due_date = \'' + exactDateFromReportParams + '\' ' : '') + 
    (startDateFromReportParams ? 'AND ' + TASK_OBJECT_API_KEY + '.due_date >= \'' + startDateFromReportParams + '\' ' : '') + 
    (endDateFromReportParams ? 'AND ' + TASK_OBJECT_API_KEY + '.due_date <= \'' + endDateFromReportParams + '\' ' : '') + 
    (locationIdsFromReportParams.length > 0 ? 'AND locations.id IN (' + locationIdsFromReportParams.join() + ') ' : '');

  // build the query out of the parts
  paqlQuery = paqlQuery +
    FIRST_PAQL_QUERY_SELECT +
    FIRST_PAQL_QUERY_BY +
    FIRST_PAQL_QUERY_WHERE +
    FIRST_PAQL_QUERY_ORDER_BY;

  // use peach library to make api calls inside reports runner
  return peach.post(
    url,
    {
      query  : paqlQuery,
      params : [] // dont add REPORT_PARAMS - we have already parsed them and included in our paqlQuery, so just send empty array
    },
    function(error, response) {
      if (error) {
        return errorCallback(error);
      } else {
        return successCallback(response);
      }
    }
  );

}

// Function which will load results of the second PAQL query, accepts two callbacks
function fetchSecondQueryPAQLResults(successCb, errorCb) {

  var successCallback = successCb || reportSuccessCallback;
  var errorCallback   = errorCb || reportErrorCallback;
  var url             = API_URL + '/waql'; // api endpoint for executing PAQL queries
  var paqlQuery       = '';

  // update WHERE with report input params
  // in basic reports this is done automatically, in coded report developer should parse input params himself
  // and remember to use them in any data requests he makes in the report
  SECOND_PAQL_QUERY_WHERE = SECOND_PAQL_QUERY_WHERE +
    (exactDateFromReportParams ? 'AND ' + TASK_OBJECT_API_KEY + '.due_date = \'' + exactDateFromReportParams + '\' ' : '') + 
    (startDateFromReportParams ? 'AND ' + TASK_OBJECT_API_KEY + '.due_date >= \'' + startDateFromReportParams + '\' ' : '') + 
    (endDateFromReportParams ? 'AND ' + TASK_OBJECT_API_KEY + '.due_date <= \'' + endDateFromReportParams + '\' ' : '') + 
    (locationIdsFromReportParams.length > 0 ? 'AND locations.id IN (' + locationIdsFromReportParams.join() + ') ' : '');

  // build the query out of the parts
  paqlQuery = paqlQuery +
    SECOND_PAQL_QUERY_SELECT +
    SECOND_PAQL_QUERY_BY +
    SECOND_PAQL_QUERY_WHERE +
    SECOND_PAQL_QUERY_ORDER_BY;

  // use peach library to make api calls inside reports runner
  return peach.post(
    url,
    {
      query  : paqlQuery,
      params : [] // dont add REPORT_PARAMS - we have already parsed them and included in our paqlQuery, so just send empty array
    },
    function(error, response) {
      if (error) {
        return errorCallback(error);
      } else {
        return successCallback(response);
      }
    }
  );

}

// Function used to load users data - we will only have user ids in PAQL results, accepts two callbacks
function fetchUsers(successCb, errorCb) {

  var url         = API_URL + '/users'; // api endpoint for users data
  var queryParams = {
    fields : 'id,first_name,last_name', // limit data only to those fields, we don't need anything else
    limit  : GET_QUERY_API_LIMIT, // default limit is 100, load max available instead
    sort   : 'id' // sort results by id, because why not
  };

  // now, if so far we got some user ids in the PAQL results (and we probably will) we add a find filter
  // because we dont need to load all users available on account, only the ones who were assigned with some tasks
  if (userIdsFromPAQLResults.length > 0) {

    queryParams.find = encodeFindParams({
      id: {
        $in: userIdsFromPAQLResults
      }
    });

  }

  // again, use peach to make api calls in report runner
  return peach.get(
    url,
    queryParams,
    function(error, response) {
      // if there will be more than GET_QUERY_API_LIMIT results returned, we need to make additional calls to load
      // all the pages with the data - handlePeachGetRespose is the function we have created for that
      return handlePeachGetRespose(error, response, url, queryParams, successCb, errorCb);
    }
  );

}

// A helper function which will be very useful - will return index of the column in the result set columns list
// Gets columns array and columnName of the column we want to get index of
function findColumnIndex(columns, columnName) {

  var foundIndex = -1;

  _.each(
    columns,
    function(column, index) {
      var name = _.isArray(column) ? column[0].name : column.name;
      if (name === columnName) {
        foundIndex = index;
        return false; // terminates _.each loop
      }
    }
  );

  return foundIndex;

}

// Helper function which we will use to pluck user ids from PAQL results
// Gets array of raw PAQL results and array of PAQL columns
function getUserIdsFromPAQLResults(paqlResults, paqlColumns) {

  paqlResults = paqlResults || [];
  paqlColumns = paqlColumns || [];

  var ids = [];
  var idsIndex = findColumnIndex(paqlColumns, USER_ID_COLUMN_NAME);

  if (idsIndex !== -1) {

    ids = _.map(
      _.uniq(
        _.filter(
          _.map(paqlResults, idsIndex)
        )
      ),
      function(id) {
        return parseInt(id, 10);
      }
    );

  }

  return ids;

}

// Helper function which will return user name for given user id
function getUserName(userId) {

  var user = _.get(usersById, userId, {});
  var username = _.get(user, 'first_name', '') + ' ' + _.get(user, 'last_name', '');

  return username !== ' ' ? username : '[UNKNOWN USER]';

}

// main function of the report, acceprts two callbacks, but if none will be given, will use reportSuccessCallback and reportErrorCallback instead
function loadDataAndCombineResults(success, error) {

  var successCallback = success || reportSuccessCallback;
  var errorCallback   = error || reportErrorCallback;

  // if there were any params set for the report, parse dates and location ids from them, and leave original params unchanged
  // params will be an array of strings returned by the Reports app
  if (REPORT_PARAMS) {

    _.each(
      REPORT_PARAMS,
      function(param) {

        if (param.indexOf('DAY = ') !== -1) {
          exactDateFromReportParams = _.get(param.match(/'(.*?)'/), 1, null); // date part form "DAY = 'YYYY-MM-DD'"
        }

        if (param.indexOf('DAY >= ') !== -1) {
          startDateFromReportParams = _.get(param.match(/'(.*?)'/), 1, null); // date part form "DAY = 'YYYY-MM-DD'"
        }

        if (param.indexOf('DAY <= ') !== -1) {
          endDateFromReportParams = _.get(param.match(/'(.*?)'/), 1, null); // date part form "DAY = 'YYYY-MM-DD'"
        }

        if (param.indexOf('locations.id') !== -1) {
          locationIdsFromReportParams = param.substring(param.indexOf('(') + 1, param.indexOf(')'));
          locationIdsFromReportParams = _.map(
            locationIdsFromReportParams.split(','),
            function(id) {
              return parseInt(id, 10);
            }
          );
        }

        return;

      }
    );

  }

  // Load the data by calling functions one by one
  return async.series(
    [
      // load and store first PAQL query raw output, then get user ids from it
      function(callback) {
        return fetchFirstQueryPAQLResults(
          function(response) {
            firstQueryPaqlResults  = _.get(response, 'results', []);
            firstQueryPaqlColumns  = _.get(response, 'columns', []);
            userIdsFromPAQLResults = getUserIdsFromPAQLResults(firstQueryPaqlResults, firstQueryPaqlColumns);
            return callback(null, response);
          },
          callback
        );
      },
      // load and store second PAQL query raw output,
      // then get user ids from it and combine them with user ids we have loaded with first PAQL query
      function(callback) {
        return fetchSecondQueryPAQLResults(
          function(response) {
            secondQueryPaqlResults = _.get(response, 'results', []);
            secondQueryPaqlColumns = _.get(response, 'columns', []);
            userIdsFromPAQLResults = _.union(
              userIdsFromPAQLResults,
              getUserIdsFromPAQLResults(secondQueryPaqlResults, secondQueryPaqlColumns)
            );
            return callback(null, response);
          },
          callback
        );
      },
      // load users data
      function(callback) {
        if (userIdsFromPAQLResults.length > 0) {
          return fetchUsers(
            function(response) {
              usersById = _.zipObject(_.map(response.results, 'id'), response.results);
              return callback(null, response);
            },
            callback
          );
        } else {
          return callback();
        }
      }
    ],
    function(error, results) {
      // if any of the data loading functions returned error, then return report error and finish
      if (error) {
        return errorCallback(error);
      // if everything was ok so far, combine loaded data
      } else {
        return combineAndReturnResults(results);
      }
    }
  );

}

// In this function we will combine all the data we have loaded so far and build the final report output,
// which has to follow some rules
function combineAndReturnResults(allLoadedData) {

  var output = null;
  var options = {};

  // actually we need to do all this only if at least one of the PAQL queries returned any data
  // because if we got not results, we can also just return empty set
  if (
    (firstQueryPaqlResults.length > 0 && firstQueryPaqlColumns.length > 0) ||
    (secondQueryPaqlResults.length > 0 && secondQueryPaqlColumns.length > 0)
  ) {

    // call helper function to build the output
    output = buildCombinedResults();

    var columns = _.get(output, 'paqlColumns', []);
    var completedTasksCountColumnIndex = findColumnIndex(columns, COMPLETED_TASKS_COLUMN_NAME);
    var activeTasksCountColumnIndex = findColumnIndex(columns, ACTIVE_TASKS_COLUMN_NAME);
    var percentageColumnIndex = findColumnIndex(columns, COMPLETION_PERCENT_COLUMN_NAME);

    // build display options - we want simple integers in two columns and percentage rounded to 2 decimals
    // lets also add some colors - for example, if user has less than 40% tasks completed, lets display the percentage in red
    options = {
      numbers: [
        {
          column: completedTasksCountColumnIndex,
          precision: 0
        },
        {
          column: activeTasksCountColumnIndex,
          precision: 0
        },
        {
          column: percentageColumnIndex,
          precision: 2
        }
      ],
      conditional: [
        {
          column: percentageColumnIndex,
          rules: [
            {
              upper_limit     : 40,
              lower_limit     : 0,
              text_color      : '#000000',
              background_color:  '#fa1010'
            },
            {
              upper_limit     : 100,
              lower_limit     : 40,
              text_color      : '#000000',
              background_color: '#4f4f4f'
            },
            
          ]
        }
      ]
    };

  }

  // call the final report callback here
  // coded report has to return data formatted like:
  /* {
    results        : [['abc', 123, ...], ['def', 456, ...], ...],
    columns        : [{name: 'column1', type: 'attribute'}, {name: 'column2', type: 'metric'}, ...],
    display_options: {...}
  } */
  return reportSuccessCallback({
    results        : _.get(output, 'paqlResults', []),
    columns        : _.get(output, 'paqlColumns', []),
    display_options: options
  });


}

// This is the helper function which combines data from multiple data requests into one properly formatted array of results
function buildCombinedResults() {

  var firstQueryResultsUserIDColumnIndex = findColumnIndex(firstQueryPaqlColumns, USER_ID_COLUMN_NAME);
  var firstQueryResultsCompletedTasksCountIndex = findColumnIndex(firstQueryPaqlColumns, COMPLETED_TASKS_COLUMN_NAME);
  var secondQueryResultsUserIDColumnIndex = findColumnIndex(secondQueryPaqlColumns, USER_ID_COLUMN_NAME);
  var secondQueryResultsActiveTasksCountIndex = findColumnIndex(secondQueryPaqlColumns, ACTIVE_TASKS_COLUMN_NAME);

  var combinedPaqlResults = [];
  var combinedPaqlColumns = [];

  var totalActiveTasks    = new Big(0); // for aggregating all active tasks - we will use it in last row for totals
  var totalCompletedTasks = new Big(0); // for aggregating all completed tasks - we will use it in last row for totals
  var totalPercentage     = new Big(0); // for aggregating total percentage - we will use it in last row for totals

  // because we cannot be sure if there were results returned by any of the queries, we have to loop through results of both
  // starting with first query results
  _.each(
    firstQueryPaqlResults,
    function(paqlResultRow) {

      var combinedResultRow   = [];
      // get user id from original first query result set row
      var userId              = paqlResultRow[firstQueryResultsUserIDColumnIndex];
      // use the user id to find username
      var userName            = getUserName(userId);
      // get the completed tasks count from this row and store it as a Big.js value - it helps with math later on
      var completedTasksCount = Big(paqlResultRow[firstQueryResultsCompletedTasksCountIndex] || 0);

      // now use the values we got from the original result row and build valid output row
      // it will always contain 5 columns:
      combinedResultRow.push(userId); // user id
      combinedResultRow.push(userName); // user name
      combinedResultRow.push(completedTasksCount); // completed tasks count
      combinedResultRow.push(Big(0)); // active tasks count - set to 0 for now until we get it from second query results
      combinedResultRow.push(Big(0)); // completed to total percentage - set to 0 for now until we get active tasks cound from second query results

      totalCompletedTasks = totalCompletedTasks.add(completedTasksCount); // update total for completed tasks

      combinedPaqlResults.push(combinedResultRow); // push the row data we have built to the final output array

      return;

    }
  );

  // now lets loop though second query results
  _.each(
    secondQueryPaqlResults,
    function(paqlResultRow) {

      var combinedResultRow = [];
      // get user id from original second query result set row
      var userId            = paqlResultRow[secondQueryResultsUserIDColumnIndex];
      // use the user id to find username
      var userName          = getUserName(userId);
      // get the active tasks count from this row and store it as a Big.js value - it helps with math later on
      var activeTasksCount  = Big(paqlResultRow[secondQueryResultsActiveTasksCountIndex] || 0);

      // now use the values we got from the original result row and build valid output row
      // it will always contain 5 columns:
      combinedResultRow.push(userId); // user id
      combinedResultRow.push(userName); // user name
      combinedResultRow.push(Big(0)); // completed tasks count - put 0 for now, later on we will check if we didnt load this value for this user in the first query
      combinedResultRow.push(activeTasksCount); // active tasks count
      combinedResultRow.push(Big(0)); // completed to total percentage - set to 0 for now until we check if we have loaded completed tasks count for this user

      totalActiveTasks = totalActiveTasks.add(activeTasksCount); // update total for active tasks

      // now we look in the data we have already parsed from the first query results
      // and try to find if we didn't parse any row with the user id exactly the same as in this row parsed from second query results
      // if we find such row in already parsed data, that means we need to update it
      // it will have the data of results from first and second queries combined
      if (row = _.find(combinedPaqlResults, (resultRow) => { return resultRow[0] === userId; })) {
        // throw away what we have built in this iteration,
        // use the already parsed 'row' from first query as the output for current row from the second query
        combinedResultRow = row; 
        // just update it with active tasks count from current row of the second query...
        combinedResultRow[3] = activeTasksCount;
        // and update percentage value with some calculated one
        combinedResultRow[4] = !(combinedResultRow[2].add(combinedResultRow[3])).eq(0) ? 
          combinedResultRow[2].div(combinedResultRow[2].add(combinedResultRow[3])).times(100) :
          Big(0);
      // if first query did not return any data for user id the same as current row of second query,
      // then just push it as it is to the final output array
      } else {
        combinedPaqlResults.push(combinedResultRow);
      }

      return;

    }
  );

  // at this moment we already have data from both queries combined in the combinedPaqlResults array
  // we can optionally sort them up here, but it usually will be done in Reports app UI
  // anyway, lets sort results by user id ascending
  combinedPaqlResults = _.orderBy(combinedPaqlResults, [0], ['asc']);

  // we also probably have to push last row which will hold some totals
  var combinedReportTotalsResultRow = [];

  // calculate total percentage
  totalPercentage = !(totalCompletedTasks.add(totalActiveTasks)).eq(0) ? 
    totalCompletedTasks.div(totalCompletedTasks.add(totalActiveTasks)).times(100) :
    Big(0);

  // build totals row
  combinedReportTotalsResultRow.push('TOTAL'); // put TOTAL in columns which won't have any metric value
  combinedReportTotalsResultRow.push('TOTAL'); // put TOTAL in columns which won't have any metric value
  combinedReportTotalsResultRow.push(totalCompletedTasks); // put total of completed tasks of all users
  combinedReportTotalsResultRow.push(totalActiveTasks); // put total of active tasks of all users
  combinedReportTotalsResultRow.push(totalPercentage); // put total percentage

  // push the totals row to final output array
  combinedPaqlResults.push(combinedReportTotalsResultRow);

  // finally, build array of columns
  // number of columns and their type has to match the number and type of values in each output array row
  combinedPaqlColumns.push([{name: USER_ID_COLUMN_NAME, type: 'attribute'}]);
  combinedPaqlColumns.push([{name: USER_NAME_COLUMN_NAME, type: 'attribute'}]);
  combinedPaqlColumns.push([{name: COMPLETED_TASKS_COLUMN_NAME, type: 'metric'}]);
  combinedPaqlColumns.push([{name: ACTIVE_TASKS_COLUMN_NAME, type: 'metric'}]);
  combinedPaqlColumns.push([{name: COMPLETION_PERCENT_COLUMN_NAME, type: 'metric'}]);

  // return combined results
  return {
    paqlResults: combinedPaqlResults,
    paqlColumns: combinedPaqlColumns
  };

}

// This is a helper function - stringifies objects for api queries
function encodeFindParams(findParams) {
  return JSON.stringify(findParams);
}

// This function is called as a callback for peach.get
// it checks if there are more than GET_QUERY_API_LIMIT results in the request result set
// and automatically loads all the results it didnt get in the first reuqest using handleBigResultSetHelper
function handlePeachGetRespose(error, response, url, queryParams, successCb, errorCb) {

  var successCallback = successCb || reportSuccessCallback;
  var errorCallback   = errorCb || reportErrorCallback;

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

function handleBigResultSetHelper(initialResponse, url, params, success, error) {

  var totalResults    = [];
  var pagesToLoad     = Math.ceil(initialResponse.count / GET_QUERY_API_LIMIT);
  var successCallback = success || reportSuccessCallback;
  var errorCallback   = error || reportErrorCallback;

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

/**
 * Returns report callback with custom report data
 * @param  {Object} data object which holds report data
 * @return {Function} custom report callback with data passed in
 */
function reportSuccessCallback(data) {
  return done(null, data);
}

/**
 * Returns report callback with error
 * @param  {Object} error object which holds error details
 * @return {Function} custom report callback with error passed in
 */
function reportErrorCallback(error) {
  return done(error, null);
}
