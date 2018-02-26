import { DB_FIELDS } from '../../../app.const';
import _ from 'lodash';

const API_KEY = 'tdd_task';
const FIELDS = ['description', 'is_complete', 'location_id'];

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
    return _.extend(_.pick(this, FIELDS), {id: this.id});
  }

  toggleStatus() {
    this.is_complete = !this.is_complete;
  }

  static fromRaw(data = null) {

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

  static isValid(task = null) {

    return task &&
      task instanceof Task &&
      _.has(task, 'description') &&
      _.isString(task.description) &&
      task.description.length <= 256 &&
      _.has(task, 'is_complete') &&
      _.isBoolean(task.is_complete) &&
      _.has(task, 'location_id') &&
      _.isNumber(task.location_id);

  }

}
