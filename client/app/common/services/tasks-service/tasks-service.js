import { Task } from '../../models/task/task';
import angular from 'angular';
import 'ng-peach';

const moduleName = 'tasksService';
const serviceName = 'tasks';

class TasksService {

  constructor($peach) {

    this.$peach = $peach;
    this.$resource = $peach.api(Task.getApiKey());

  }

  load(findParams = null, otherParams = null) {

    return this.$resource.find(findParams, otherParams)
      .then((response) => {
        return Task.fromRaw(response.results || []);
      });

  }

}

TasksService.$inject = ['$peach'];

angular.module(moduleName, ['ngPeach'])
  .service(serviceName, TasksService);

export default {
  moduleName,
  service: TasksService,
  serviceName: serviceName
};
