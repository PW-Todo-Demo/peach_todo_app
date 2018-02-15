import tasksService from '../../common/services/tasks-service/tasks-service';

class TodoController {

  constructor($tasks) {

    this.$tasks = $tasks;

    this.page_title = 'ToDo List';
    this.tasks = []; // initialize with empty array

    this.activate();

  }

  activate() {

    this.$tasks.load()
      .then((tasks) => {
        this.tasks = tasks;
      });

  }

}

TodoController.$inject = [tasksService.serviceName];

export default {
  controller: TodoController,
  controllerName: 'TodoController',
  controllerAs: '$todo',
  name: 'Todo',
  template: require('./todo.html')
};
