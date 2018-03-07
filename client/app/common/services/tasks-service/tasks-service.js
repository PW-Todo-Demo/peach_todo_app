import { BaseDataService } from '../base-data-service';
import { Task } from '../../models/task/task';
import angular from 'angular';
import 'ng-peach';

const MODULE_NAME = 'tasksService';
const SERVICE_NAME = 'tasks';

class TasksService extends BaseDataService {

  constructor($peach, $q) {
    super($peach, $q, Task);
  }

}

TasksService.$inject = ['$peach', '$q'];

angular.module(MODULE_NAME, ['ngPeach'])
  .service(SERVICE_NAME, TasksService);

export default {
  module_name: MODULE_NAME,
  service: TasksService,
  service_name: SERVICE_NAME
};
