/**
 * This trigger will ensure that non-admins will only be able to load their own tasks
 * @author you
 * */
 
 

_ = lodash4; // get rid of old lodash, use latest one available on untrusted



/* TRIGGER VARIABLES */

var APP_API_KEY = req.app_key;
var ADMIN_PERMISSION_API_KEY = 'todo_admin';
var TASK_OBJECT_API_KEY = 'tdd_task';
var USERS_OBJECT_API_KEY = 'users';

var filters = _.get(req, ['query', 'find'], {});
var includes = _.get(req, ['query', 'includes'], {});
var includesFilters = _.get(req, ['query', 'findIncludes'], {});
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

    if (
      _.isString(includes) &&
      includes.indexOf(USERS_OBJECT_API_KEY) !== -1
    ) {

      var updatedIncludesFilters = {};
      var userFilterFound = false;

      // if filters were already specified in request - they will be stringified JSON, so parse them
      if (_.isString(includesFilters)) {
        includesFilters = JSON.parse(includesFilters);
      }

      _.each(
        includesFilters,
        function(filters, key) {

          if (key.indexOf(USERS_OBJECT_API_KEY) !== -1) {

            filters = {
              $and: [
                filters,
                {id: req.user_id}
              ]
            };

            updatedIncludesFilters[USERS_OBJECT_API_KEY] = filters; // this will remove :optional flag if it was set in original key
            userFilterFound = true;

          } else {

            updatedIncludesFilters[key] = filters;

          }

          return;

        }
      );

      if (!userFilterFound) {

        updatedIncludesFilters[USERS_OBJECT_API_KEY] = {id: req.user_id};

      }

      defaultSuccessHandler({query: _.extend(req.query, {findIncludes: JSON.stringify(updatedIncludesFilters)})});


    } else {

      // if filters were already specified in request - they will be stringified JSON, so parse them
      if (_.isString(filters)) {
        filters = JSON.parse(filters);
      }

      if (!_.isEmpty(filters)) {
        
        filters = {
          $and: [
            filters,
            {assigned_user_id: req.user_id}
          ]
        };

      } else {

        filters = {assigned_user_id: req.user_id};

      }

      defaultSuccessHandler({query: _.extend({}, req.query, {find: JSON.stringify(filters)})});

    }

  } catch (ex) {

    defaultErrorHandler(ex);

  }

} else {

  defaultSuccessHandler();
  
}



/* TRIGGER HELPER FUNCTIONS */

function logData(message, extendedData) {

  if (!_.isUndefined(extendedData)) {
    peach.log(message, extendedData);
  } else {
    peach.log(message);
  }

  return;

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

  logData(TASK_OBJECT_API_KEY + ' BEFORE GET trigger error', error);
  done(error);

  return;

}
