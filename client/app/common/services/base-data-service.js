import { Task } from '../models/task/task';
import { User } from '../models/user/user';
import _ from 'lodash';
import 'ng-peach';

const SUPPORTED_MODEL_CLASSES = [Task.name, User.name];

export class BaseDataService {

  constructor($peach, $q, modelClass) {

    if (
      typeof modelClass === 'function' &&
      SUPPORTED_MODEL_CLASSES.indexOf(modelClass.name) !== -1
    ) {

      this.$peach = $peach;
      this.$q = $q;
      this.$resource = $peach.api(modelClass.getApiKey());

      this._modelClass = modelClass;

    } else {

      throw new TypeError(`${modelClass} is not a constructor of supported model class.`);

    }

  }

  load(findParams = null, otherParams = null) {

    return this.$resource.find(findParams, otherParams)
      .then((response) => {
        return this._modelClass.fromRaw(
          _.has(response, 'id') ?
            response :
            _.get(response, 'results', [])
        );
      });

  }

  save(modelInstance = null) {

    if (!this._modelClass.isValid(modelInstance)) {
      return this.$q.reject({
        message: `Could not save - invalid ${this._modelClass.name} object given.`,
        object: modelInstance
      });
    }

    return this.$resource.save(modelInstance.forDB());

  }

}
