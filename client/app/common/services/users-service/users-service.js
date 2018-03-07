import { BaseDataService } from '../base-data-service';
import { User } from '../../models/user/user';
import angular from 'angular';
import 'ng-peach';

const MODULE_NAME = 'usersService';
const SERVICE_NAME = 'users';

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

angular.module(MODULE_NAME, ['ngPeach'])
  .service(SERVICE_NAME, UsersService);

export default {
  module_name: MODULE_NAME,
  service: UsersService,
  service_name: SERVICE_NAME
};
