import AccountPrefsService from '../account-prefs-service/account-prefs-service';
import TaskSchedulesService from '../task-schedules-service/task-schedules-service';
import {
  ACCT_PREF_KEY_FOR_OVERDUE_TASKS_TASK_SCHEDULE, APP_ID, APP_PERMISSIONS, OVERDUE_TASKS_TASK_ID,
  OVERDUE_TASKS_TASK_SCHEDULE
} from '../../../app.const';
import angular from 'angular';
import _ from 'lodash';
import 'ng-peach';

const MODULE_NAME = 'initializeService';
const SERVICE_NAME = 'initialize';

class InitializeService {

  constructor($accountPrefs, $peach, $q, $taskSchedules) {

    this.$accountPrefs = $accountPrefs;
    this.$peach = $peach;
    this.$q = $q;
    this.$taskSchedules = $taskSchedules;

    this.accountInfo = {};
    this.initPromise = this.activate();
    this.permissions = {};
    this.userInfo = {};

  }

  activate() {

    return this.$q.all({
      account: this.$peach.account.getInfo(),
      user: this.$peach.user.getInfo()
    })
      .then((response) => {

        this.accountInfo = response.account;
        this.userInfo = response.user;

        return _.get(this.accountInfo, 'is_admin', false);

      })
      .then((isAdmin) => {

        let promises = {
          account_admin: this.$q.resolve(isAdmin)
        };

        _.each(
          APP_PERMISSIONS,
          (appPermission) => {
            promises[appPermission] = this.$peach.app.hasPermission(appPermission);
            return;
          }
        );

        return this.$q.all(promises);

      })
      .then((loadedPermissions) => {

        this.permissions = loadedPermissions;

        if (this.permissions.account_admin) {
          return this.$peach.account.getPrefs(ACCT_PREF_KEY_FOR_OVERDUE_TASKS_TASK_SCHEDULE);
        }

        return false;

      })
      .then((response) => {

        if (
          response !== false &&
          _.get(response, 'value', 'false') === 'false'
        ) {

          return this.$taskSchedules.load({task_id: OVERDUE_TASKS_TASK_ID})
            .then((response) => {

              if (response.count === 0) {
                return this.$taskSchedules.save(OVERDUE_TASKS_TASK_SCHEDULE);
              }

              return true;

            })
            .then(() => {

              return this.$accountPrefs.save({
                app_id: APP_ID,
                key: ACCT_PREF_KEY_FOR_OVERDUE_TASKS_TASK_SCHEDULE,
                value: true
              });

            });

        } else {

          return this.$q.resolve();

        }

      });

  }

  getAccountInfo() {

    return this.isReady()
      .then(() => {
        return _.cloneDeep(this.accountInfo);
      });

  }

  getPermissions() {

    return this.isReady()
      .then(() => {
        return _.cloneDeep(this.permissions);
      });

  }

  getUserInfo() {

    return this.isReady()
      .then(() => {
        return _.cloneDeep(this.userInfo);
      });

  }

  isReady() {
    return this.initPromise;
  }

}

InitializeService.$inject = [
  AccountPrefsService.service_name,
  '$peach',
  '$q',
  TaskSchedulesService.service_name
];

angular.module(MODULE_NAME, ['ngPeach'])
  .service(SERVICE_NAME, InitializeService);

export default {
  module_name: MODULE_NAME,
  service: InitializeService,
  service_name: SERVICE_NAME
};
