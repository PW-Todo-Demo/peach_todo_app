/**
 * The purpose of this trigger is to send a notification to user assigned to task.
 * If bulk request was made, the trigger will send notifications to all users for whom the tasks were created.
 * @author you
 * */
 
 

_ = lodash4; // get rid of old lodash, use latest one available on untrusted



/* TRIGGER VARIABLES */

var TASK_OBJECT_API_KEY = 'tdd_task';
var TASK_ASSIGNED_ALERT_API_KEY = 'task_assigned';
var userIds = [];



/* TRIGGER BODY */ 

// if bulk POST - grab user ids
if (_.get(req, ['body', 'collection'], null)) {

  userIds = _.map(
    _.get(req, ['body', 'collection'], []),
    'assigned_user_id'
  );

} else {

  userIds.push(
    _.get(req, ['body', 'assigned_user_id'], null)
  );

}

userIds = _.uniq(_.filter(userIds));

if (userIds.length > 0) {

  peach.alert(
    TASK_ASSIGNED_ALERT_API_KEY,
    {
      user_ids: userIds
    },
    function(error, result) {
      if (error) {
        return defaultErrorHandler(error);
      }
      return defaultSuccessHandler(userIds);
    }
  );

} else {

  defaultSuccessHandler(userIds);

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

  logData(TASK_OBJECT_API_KEY + ' AFTER POST trigger error', error);
  done(error);

  return;

}
