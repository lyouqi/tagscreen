
app.factory('socket', function (socketFactory,configService) {
  //Create socket and connect to http://chat.socket.io
  var myIoSocket = io.connect( configService.server + "/socket");

  mySocket = socketFactory({
    ioSocket: myIoSocket
  });

  return mySocket;
});




app.service('utilService', function (configService, $http, $q) {
  var service = {};

  /**
   *  GET 方法
   * @param url
   *
   * @returns {*}
   */
  service.get = function (url) {

    var deferred = $q.defer();
    try {
      $http.get(configService.server + url).success(function (data) {
        if (data.errorCode == 0) {
          deferred.resolve(data);
        } else {
          if (data.errorCode == 401) {
            window.location.href = "/login";
          } else {
            deferred.reject(data);
          }
        }
      }).error(function (data) {
        deferred.reject(data);
      });
    } catch (e) {
      deferred.reject({errorCode: -1, message: e.message});
    }
    return deferred.promise;
  };

  /**
   * POST 方法
   * @param url
   * @param postData
   * @returns {*}
   */
  service.post = function (url, data) {

    var deferred = $q.defer();
    try {
      $http.post(configService.server + url, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
      }).success(function (data) {
        if (data.errorCode == 0) {
          deferred.resolve(data);
        } else {
          if (data.errorCode == 401) {
            window.location.href = "/login";
          } else {
            deferred.reject(data);
          }
        }
      }).error(function (data) {
        deferred.reject(data);
      });
    } catch (e) {
      deferred.reject({errorCode: -1, message: e.message});
    }
    return deferred.promise;
  };

  return service;

});

