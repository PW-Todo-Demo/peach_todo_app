import angular from 'angular';
import 'ng-peach';

const API_KEY = 'task_schedules';
const MODULE_NAME = 'taskSchedulesService';
const SERVICE_NAME = 'taskSchedules';

class TaskSchedulesService {

  constructor($peach, $q) {

    this.$peach = $peach;
    this.$q = $q;
    this.$resource = this.$peach.api(API_KEY);

  }

  load(findParams = null, otherParams = null) {
    return this.$resource.find(findParams, otherParams);
  }

  save(data = {}) {
    return this.$resource.save(data);
  }

}

TaskSchedulesService.$inject = ['$peach', '$q'];

angular.module(MODULE_NAME, ['ngPeach'])
  .service(SERVICE_NAME, TaskSchedulesService);

export default {
  module_name: MODULE_NAME,
  service: TaskSchedulesService,
  service_name: SERVICE_NAME
};
