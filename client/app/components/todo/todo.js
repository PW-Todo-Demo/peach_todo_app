import 'ng-peach';

class TodoController {

  constructor($peach) {

    this.$peach = $peach;

    this.page_title = 'ToDo List';
    this.tasks = []; // initialize with empty array

    this.activate();

  }

  activate() {

    let tasksResource = this.$peach.api('tdd_task');

    tasksResource.find()
      .then((response) => {
        this.tasks = response.results || this.tasks;
      });

  }

}

TodoController.$inject = ['$peach'];

export default {
  controller: TodoController,
  controllerName: 'TodoController',
  controllerAs: '$todo',
  name: 'Todo',
  template: require('./todo.html')
};
