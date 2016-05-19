app.controller('LoginController', function ($scope, $state, $sanitize) {


  $scope.nickname = "guest";

  $scope.join = function (nickname) {
    //sanitize the nickname
    var nickname = $sanitize(nickname);
    if (nickname) {
      $state.go('chat', {nickname: nickname})
    }
  }




});
