app.controller('LoginController', function ($scope, $state, $sanitize) {


  $scope.nickname = "G"+Math.ceil(Math.random()*1000);

  $scope.join = function (nickname) {
    //sanitize the nickname
    var nickname = $sanitize(nickname);
    if (nickname) {
      $state.go('chat', {nickname: nickname},{reload: true})
    }
  }




});
