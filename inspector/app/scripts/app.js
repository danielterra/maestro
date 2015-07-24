'use strict';

/**
 * @ngdoc overview
 * @name inspectorApp
 * @description
 * # inspectorApp
 *
 * Main module of the application.
 */
var app = angular
  .module('inspectorApp', [
    'ngAnimate',
    'ngCookies',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'btford.socket-io'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

app.factory('maestro', function (socketFactory) {
  return socketFactory();
});
