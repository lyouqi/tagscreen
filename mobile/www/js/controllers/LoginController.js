app.controller('LoginController', function ($scope,configService, $state, $sanitize) {


  $scope.nickname = "G"+Math.ceil(Math.random()*1000);

  $scope.server = window.localStorage.getItem("serverIP");

  if(!$scope.server){
    $scope.server = configService.server;
  }


  $scope.join = function (nickname,server) {

    console.log("joining....");

    if(server){

      window.localStorage.setItem("serverIP", server);

      server = server+":" + configService.port;
      console.log(server);
      configService.server = server;

      //sanitize the nickname
      var nickname = $sanitize(nickname);
      if (nickname) {
        $state.go('chat', {nickname: nickname},{reload: true})
      }
    }


  }

});
