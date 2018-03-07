import { DB_FIELDS } from '../../../app.const';
import _ from 'lodash';

const API_KEY = 'users';
const DEFAULT_USERNAME = '[Unknown user]';
const FIELDS = ['first_name', 'last_name'];

export class User {

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

  get username() {

    let firstName = _.get(this, 'first_name', null);
    let lastName = _.get(this, 'last_name', null);

    return (firstName || lastName) ? `${firstName} ${lastName}` : DEFAULT_USERNAME;

  }

  static getDefaultUserName() {
    return DEFAULT_USERNAME;
  }

  static fromRaw(data = null) {

    if (_.isArray(data)) {

      let users = [];

      _.each(
        data,
        (u) => {
          users.push(new User(u));
        }
      );

      return users;

    }

    if (_.isObject(data)) {

      let user = new User(data);

      return user;

    }

    return null;

  }

  static getApiKey() {
    return API_KEY;
  }

  static isValid(user = null) {

    return user &&
      user instanceof User &&
      _.has(user, 'first_name') &&
      _.isString(user.first_name) &&
      _.has(user, 'last_name') &&
      _.isString(user.last_name) &&
      _.has(user, 'id') && // we will not create users in this app, so we always expect existing users with id
      _.isNumber(user.id);

  }

}
