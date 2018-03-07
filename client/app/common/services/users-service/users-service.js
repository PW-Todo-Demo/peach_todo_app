import { BaseDataService } from '../base-data-service';
import { User } from '../../models/user/user';
import angular from 'angular';
import 'ng-peach';

const moduleName = 'usersService';
const serviceName = 'users';

class UsersService extends BaseDataService {

  constructor($peach, $q) {
    super($peach, $q, User);
  }

  // override BaseDataService.save
  save(modelInstance = null) {

    return this.$q.reject({
      message: `Editing users not possible in this app.`
    });

  }

}

UsersService.$inject = ['$peach', '$q'];

angular.module(moduleName, ['ngPeach'])
  .service(serviceName, UsersService);

export default {
  moduleName,
  service: UsersService,
  serviceName: serviceName
};
