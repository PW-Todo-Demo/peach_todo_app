import TasksService from '../../common/services/tasks-service/tasks-service';
import UsersService from '../../common/services/users-service/users-service';
import { Task } from '../../common/models/task/task';
import {
  DEFAULT_INFO_TIMEOUT, DEFAULT_LOCATION_ID, DEFAULT_NG_MODEL_OPTIONS,
  MESSAGE_TYPE_ERROR, MESSAGE_TYPE_INFO
} from '../../app.const';
import _ from 'lodash';
import angular from 'angular';
import moment from 'moment-timezone';

const TEMPLATES = {
  dialog_confirm_delete: require('./dialog-confirm-delete.html'),
  dialog_confirm_save: require('./dialog-confirm-save.html'),
  page: require('./todo-edit.html')
};

class TodoEditController {

  constructor($document, $location, $log, $mdDialog, $q, $routeParams, $tasks, $timeout, $users) {

    this.$document = $document;
    this.$location = $location;
    this.$log = $log;
    this.$mdDialog = $mdDialog;
    this.$q = $q;
    this.$routeParams = $routeParams;
    this.$tasks = $tasks;
    this.$timeout = $timeout;
    this.$users = $users;

    this.accountUsers = [];
    this.blockers = {
      api_processing: false,
      initializing: true
    };
    this.currentDate = moment().toDate();
    this.editedTask = null;
    this.forms = {};
    this.info = {
      message: null,
      type: MESSAGE_TYPE_INFO
    };
    this.ngModelOptions = DEFAULT_NG_MODEL_OPTIONS;

    this.activate();

  }

  activate() {

    let taskId = _.get(this.$routeParams, 'taskId', 'new');

    return this.loadAccountUsers()
      .then(() => {

        if (taskId !== 'new') {

          return this.loadTask(parseInt(taskId, 10));

        } else {

          this.editedTask = Task.fromRaw({
            assigned_user_id: null,
            due_date: null,
            description: '',
            is_complete: false,
            location_id: DEFAULT_LOCATION_ID
          });
          return this.$q.resolve();

        }

      })
      .catch((error) => {
        return this.handleError(error);
      })
      .finally(() => {
        this.blockers.initializing = false;
        return;
      });

  }

  actionCancelDialog() {
    return this.$mdDialog.hide();
  }

  actionClose() {

    return this.$timeout(
      () => {
        this.$location.path('/todo').search('');
        return;
      }
    );

  }

  actionConfirmDeleteTask() {

    return this.$mdDialog.show({
      escapeToClose: false,
      clickOutsideToClose: false,
      disableParentScroll: true,
      hasBackdrop: true,
      parent: angular.element(this.$document[0].getElementsByClassName('peach-modal')),
      template: TEMPLATES.dialog_confirm_delete,
      controller: this.getSelf(),
      controllerAs: '$vm'
    });

  }

  actionConfirmSaveTask() {

    return this.$mdDialog.show({
      escapeToClose: false,
      clickOutsideToClose: false,
      disableParentScroll: true,
      hasBackdrop: true,
      parent: angular.element(this.$document[0].getElementsByClassName('peach-modal')),
      template: TEMPLATES.dialog_confirm_save,
      controller: this.getSelf(),
      controllerAs: '$vm'
    });

  }

  actionDelete() {

    this.blockers.api_processing = true;

    return this.actionCancelDialog()
      .then(() => {
        return this.$tasks.delete(this.editedTask);
      })
      .then(() => {
        return this.actionClose();
      })
      .catch((error) => {
        return this.handleError(error, true);
      })
      .finally(() => {
        this.blockers.api_processing = false;
        return;
      });

  }

  actionSave() {

    this.blockers.api_processing = true;

    return this.actionCancelDialog()
      .then(() => {
        return this.$tasks.save(this.editedTask);
      })
      .then(() => {
        return this.actionClose();
      })
      .catch((error) => {
        return this.handleError(error, true);
      })
      .finally(() => {
        this.blockers.api_processing = false;
        return;
      });

  }

  disableChanges() {
    return this.blockers.api_processing;
  }

  disableCancelButton() {
    return this.disableChanges();
  }

  disableDeleteButton() {
    return this.disableChanges();
  }

  disableSaveButton() {
    return this.disableChanges() ||
      this.forms.task_data_form.$invalid ||
      !Task.isValid(this.editedTask);
  }

  getSelf() {
    return () => this;
  }

  handleError(error = null, autoHide = false) {

    let message = 'There was an error, please check console log for more details.'; // default message

    if (_.isString(error)) {
      message = `There was an error: ${error}`;
    } else if (_.isObject(error) && _.has(error, 'message')) {
      message = error.message;
    }

    this.$log.error(error);
    this.showInfo({
      message: message,
      type: MESSAGE_TYPE_ERROR
    });

    if (autoHide) {

      return this.$timeout(
        () => {
          this.showInfo(); // will hide message when called with no params
          return;
        },
        DEFAULT_INFO_TIMEOUT
      );

    } else {

      return this.$q.resolve();

    }

  }

  loadTask(taskId = 0) {

    return this.$tasks.load(taskId, {includes: 'users(id,first_name,last_name)'})
      .then((task) => {
        this.editedTask = task;
        return;
      });

  }

  loadAccountUsers() {

    return this.$users.load(null, {fields: 'id,first_name,last_name', sort: 'first_name,last_name'})
      .then((accountUsers) => {
        this.accountUsers = accountUsers;
        return;
      });

  }

  showDeleteButton() {
    return Boolean(
      this.editedTask &&
      this.editedTask.id
    );
  }

  showInfo(info = {message: null, type: MESSAGE_TYPE_INFO}) {
    this.info = info;
    return;
  }

}

TodoEditController.$inject = [
  '$document',
  '$location',
  '$log',
  '$mdDialog',
  '$q',
  '$routeParams',
  TasksService.service_name,
  '$timeout',
  UsersService.service_name
];

export default {
  controller: TodoEditController,
  controllerName: 'TodoEditController',
  controllerAs: '$todoEdit',
  name: 'Todo',
  template: TEMPLATES.page
};
