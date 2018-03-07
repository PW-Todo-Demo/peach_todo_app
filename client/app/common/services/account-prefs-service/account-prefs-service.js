import angular from 'angular';
import 'ng-peach';

const API_KEY = 'account_prefs';
const MODULE_NAME = 'accountPrefsService';
const SERVICE_NAME = 'accountPrefs';

class AccountPrefsService {

  constructor($peach, $q) {

    this.$peach = $peach;
    this.$q = $q;
    this.$resource = this.$peach.api(API_KEY, {useCoreToken: true});

  }

  save(data = {}) {
    return this.$resource.save(data);
  }

}

AccountPrefsService.$inject = ['$peach', '$q'];

angular.module(MODULE_NAME, ['ngPeach'])
  .service(SERVICE_NAME, AccountPrefsService);

export default {
  module_name: MODULE_NAME,
  service: AccountPrefsService,
  service_name: SERVICE_NAME
};
