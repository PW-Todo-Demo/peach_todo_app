import { BaseDataService } from '../base-data-service';
import { Task } from '../../models/task/task';
import angular from 'angular';
import 'ng-peach';

const moduleName = 'tasksService';
const serviceName = 'tasks';

class TasksService extends BaseDataService {

  constructor($peach, $q) {
    super($peach, $q, Task);
  }

}

TasksService.$inject = ['$peach', '$q'];

angular.module(moduleName, ['ngPeach'])
  .service(serviceName, TasksService);

export default {
  moduleName,
  service: TasksService,
  serviceName: serviceName
};
