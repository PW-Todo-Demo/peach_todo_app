import _ from 'lodash';

const API_KEY = 'tdd_task';
const FIELDS = ['description', 'is_complete', 'location_id'];
const DB_FIELDS = ['id', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted', 'uri'];

export class Task {

  constructor(rawData = {}) {

    _.each(
      _.pick(rawData, [...FIELDS, ...DB_FIELDS]),
      (value, key) => {
        this[key] = value;
      }
    );

  }

  static fromRaw(data) {

    if (_.isArray(data)) {

      let tasks = [];

      _.each(
        data,
        (t) => {
          tasks.push(new Task(t));
        }
      );

      return tasks;

    }

    if (_.isObject(data)) {

      let task = new Task(data);

      return task;

    }

    return null;

  }

  static getApiKey() {
    return API_KEY;
  }

  static isValid(task) {

    return _.has(task, 'description') &&
      _.isString(task.description) &&
      task.description.length <= 256 &&
      _.has(task, 'is_complete') &&
      _.isBoolean(task.is_complete) &&
      _.has(task, 'location_id') &&
      _.isNumber(task.location_id);

  }

}
