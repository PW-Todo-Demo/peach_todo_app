import { User } from '../user/user';
import { DB_DATE_FORMAT, DB_FIELDS } from '../../../app.const';
import _ from 'lodash';
import moment from 'moment-timezone';

const API_KEY = 'tdd_task';
const FIELDS = ['assigned_user_id', 'description', 'due_date', 'is_complete', 'location_id'];

export class Task {

  constructor(rawData = {}) {

    _.each(
      _.pick(rawData, [...FIELDS, ...DB_FIELDS]),
      (value, key) => {
        this[key] = value;
      }
    );

  }

  forDB() {

    let updateableData = _.pick(this, FIELDS);

    // before sending to database, we need to replace user object data back with the user id
    if (
      _.isObject(updateableData.assigned_user_id) &&
      User.isValid(updateableData.assigned_user_id)
    ) {
      updateableData.assigned_user_id = updateableData.assigned_user_id.id;
    }

    if (_.isDate(updateableData.due_date)) {
      updateableData.due_date = moment(updateableData.due_date).format(DB_DATE_FORMAT);
    }

    if (this.id) {
      updateableData = _.extend(updateableData, {id: this.id});
    }

    return updateableData;

  }

  toggleStatus() {
    this.is_complete = !this.is_complete;
  }

  get assignedUsername() {

    return (this.assigned_user_id instanceof User) ?
      this.assigned_user_id.username :
      User.getDefaultUserName();

  }

  static fromRaw(data = null) {

    if (_.isArray(data)) {

      let tasks = [];

      _.each(
        data,
        (t) => {

          if (_.isObject(t.assigned_user_id)) {
            t.assigned_user_id = User.fromRaw(t.assigned_user_id);
          }

          tasks.push(new Task(t));

        }
      );

      return tasks;

    }

    if (_.isObject(data)) {

      if (_.isObject(data.assigned_user_id)) {
        data.assigned_user_id = User.fromRaw(data.assigned_user_id);
      }

      let task = new Task(data);

      return task;

    }

    return null;

  }

  static getApiKey() {
    return API_KEY;
  }

  static isValid(task = null) {

    return task &&
      task instanceof Task &&
      _.has(task, 'assigned_user_id') &&
      (
        _.isNumber(task.assigned_user_id) ||
        User.isValid(task.assigned_user_id)
      ) &&
      _.has(task, 'description') &&
      _.isString(task.description) &&
      task.description.length <= 256 &&
      _.has(task, 'due_date') && // can be null, but the field should be there
      _.has(task, 'is_complete') &&
      _.isBoolean(task.is_complete) &&
      _.has(task, 'location_id') &&
      _.isNumber(task.location_id);

  }

}
