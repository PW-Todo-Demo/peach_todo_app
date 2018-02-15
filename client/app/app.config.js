import Home from './components/home/home';
import Todo from './components/todo/todo';

function AppConfig($routeProvider, $httpProvider) {
  $httpProvider.interceptors.push('peachInterceptorAPI');

  $routeProvider
    .when('/home', {
      name: Home.name,
      template: Home.template,
      controller: Home.controllerName,
      controllerAs: Home.controllerAs,
      is_welcome_page: true // Reference only.  Change in DevPortal
    })
    .when('/todo', {
      name: Todo.name,
      template: Todo.template,
      controller: Todo.controllerName,
      controllerAs: Todo.controllerAs
    })
    .otherwise({
      redirectTo: '/home'
    });
}

AppConfig.$inject = ['$routeProvider', '$httpProvider'];

export default AppConfig;
