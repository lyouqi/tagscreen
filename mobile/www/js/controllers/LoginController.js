app.controller('LoginController', function ($scope,configService, $state, $sanitize) {


  $scope.nickname = "G"+Math.ceil(Math.random()*1000);

  $scope.server = configService.server;


  $scope.join = function (nickname) {

    if($scope.server){
      configService.server = $scope.server;
    }

    //sanitize the nickname
    var nickname = $sanitize(nickname);
    if (nickname) {
      $state.go('chat', {nickname: nickname},{reload: true})
    }
  }

});
