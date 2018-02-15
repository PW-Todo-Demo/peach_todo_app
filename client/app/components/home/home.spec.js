import peachApp from '../../app';
import Home from './home';

describe('Component: Home', () => {
  let $rootScope, $controller, ctrl;

  beforeEach(angular.mock.module(peachApp));

  beforeEach(angular.mock.inject(($injector) => {
    $rootScope = $injector.get('$rootScope');
    $controller = $injector.get('$controller');
    ctrl = $controller(Home.controllerName, {});
  }));

  describe('Constructor', () => {

    it('should construct a Home Controller', () => {
      expect(ctrl.title).to.be.equals('Home Page');
    });
  });

  describe('Functions', () => {

    describe('setTitle', () => {

      it('should set a new title', () => {
        ctrl.setTitle('New Title');
        expect(ctrl.title).to.be.equals('New Title');
      });
    });
  });
});
