var chat = app.controller('ChatController', function ($scope, $stateParams, $sanitize, $ionicScrollDelegate, $ionicPlatform,
                                                      $timeout, configService,socketService,dataService) {

  var TYPING_TIMER_LENGTH = 3000;

  $scope.progress = 0;
  $scope.typing = false;
  $scope.connected = false;
  $scope.message = "";

  $scope.progress = 0;
  $scope.errorRate =0;
  $scope.contentId = "Unknown";
  $scope.comments = [];


  setInterval(function(){
    $scope.$apply();
  },500);

  //Add colors
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  //loading library
  var loadLibrary = function() {
    dataService.loadLibrary().then(function (result) {

      var library = result.library;
      console.log('loading library...........');

      for (var i = 0; i < library.contents.length; i++) {
        var content = library.contents[i];
        if ($scope.contentId == content.id) {
          //reserve the system messages;
          $scope.comments = [];
          for(var j=0;j<content.comments.length;j++){
            var comment = content.comments[j];
            $scope.comments.push({progress:comment.progress, username:comment.username, color: getUsernameColor(comment.username), text:comment.text});
          }
          sortComments();
          break;
        }
      }
    })
  }

  dataService.registerObserver(function(){
    $scope.$apply(function () {

      $scope.errorRate = dataService.errorFrames / dataService.totalFrames;

      if($scope.contentId != dataService.contentId){
        $scope.comments.push({text:"Changing from "+$scope.contentId +" to "+dataService.contentId, system:"true"});

        $scope.contentId = dataService.contentId;
        loadLibrary();

      }else{

        // if($scope.progress-dataService.progress > 5){
        //   $scope.comments.push({text:"Backward",system:true});
        // }else if($scope.progress-dataService.progress<-5){
        //   $scope.comments.push({text:"Forward", system:true});
        // }

        $scope.progress = dataService.progress;

      }


    })
  })


  //load audio component
  var loadHardware = function(){
    if(window.plugins && window.plugins.audioReader){
      dataService.start(window.plugins.audioReader);
    }else{
      setTimeout(loadHardware,100);
    }

  }

  loadHardware();


  //initializing messages array
  $scope.messages = [];

  var emit = function(type, text){

      console.log('emit comments:'+type+':'+text);
      socketService.dataStream.send({
        'type':type,
        'username':$stateParams.nickname,
        'text':text,
        'progress':$scope.progress,
        'contentId':$scope.contentId
      });
  }

  var sortComments = function(){
    if($scope.comments){
      $scope.comments.sort(function(a,b){
        return a.progress-b.progress;
      })
    }
  }

  socketService.dataStream.onOpen(function(){
    $scope.connected = true;
      emit("join");
  })

  socketService.dataStream.onClose(function(){
    $scope.connected = false;
      emit("left");
  })

  socketService.dataStream.onMessage(function(message){

      console.log(message);

      var data = JSON.parse(message.data);

      console.log(data);

      if(data.type=="comment"){

        if (data.contentId && data.text && data.username && data.progress) {

          if ($scope.contentId == data.contentId) {

            $scope.comments.push({
              progress: data.progress,
              username: data.username,
              color: getUsernameColor(data.username),
              text: data.text
            });

            sortComments();
          }
          // addMessageToList(data.username, true, data.comment, data.progress)
        }

      }else if(data.type=="userJoined"){

        $scope.comments.push({text:data.username + " joined", system:true, progress:$scope.progress});
        $scope.comments.push({text:message_string(data.numUsers), system:true,progress:$scope.progress});
        sortComments();

      } else if(data.type=="userLeft"){

        $scope.comments.push({text:data.username + " left", system:true,progress:$scope.progress});
        $scope.comments.push({text:message_string(data.numUsers), system:true,progress:$scope.progress});
        sortComments();

      }

  })

  //function called when user hits the send button
  $scope.sendMessage = function (message) {

    console.log("sending message:"+message);

    if(message) {
      emit('newMessage', message);
      // addMessageToList($stateParams.nickname, true, $scope.message);
      // emit('stopTyping');
      $scope.message = ""
    }
  }



  //Generate color for the same user.
  function getUsernameColor(username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }
  
  // Return message string depending on the number of users
  function message_string(number_of_users) {
    return number_of_users === 1 ? "there's 1 participant" : "there are " + number_of_users + " participants"
  }

  $scope.commentShow = function (item) {
    if(item.system){
      return true;
    }else{
      return item.progress <= $scope.progress;
    }
  };
});

