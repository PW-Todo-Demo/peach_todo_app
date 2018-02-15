import './home.scss';
import logoImage from '../../../assets/img/logo/logo_color_2x.png';

class HomeController {
  constructor() {
    this.logoImage = logoImage;
    this.title = 'Home Page';
  }

  setTitle(title) {
    this.title = title;
  }
}

HomeController.$inject = [];

export default {
  controller: HomeController,
  controllerName: 'HomeController',
  controllerAs: 'home',
  name: 'Home',
  template: require('./home.html')
};
