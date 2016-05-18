app.controller('LoginController', function ($scope, $state, $sanitize, configService, dataService, chirpService) {

  $scope.join = function (nickname) {
    //sanitize the nickname
    var nickname = $sanitize(nickname);
    if (nickname) {
      $state.go('chat', {nickname: nickname})
    }
  }

  $scope.start = function () {

      dataService.begin(window.plugins.audioRecorder);


  }


  $scope.stop = function () {
    window.plugins.audioRecorder.stop();
  }


});
