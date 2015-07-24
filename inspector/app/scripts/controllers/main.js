'use strict';

/**
 * @ngdoc function
 * @name inspectorApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the inspectorApp
 */
angular.module('inspectorApp')
  .controller('MainCtrl', function ($scope, maestro) {
    maestro.forward('serversUpdated', $scope);

    $scope.$on('socket:serversUpdated', function (ev, data) {
        $scope.updateServers(data);
    });

    $scope.updateServers = function(data) {
        $scope.servers = data;
    };

    $scope.servers = [];

    maestro.emit('inspectorConnected');
  });
