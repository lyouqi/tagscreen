app.service('dataService', function (utilService, chirpService, configService, crcService) {

  var service = {}

  service.observers = [];
  service.errors = 0;
  service.progress = 0;
  service.contentId = "Unknown";
  service.totalFrames = 0;
  service.errorFrames = 0;


  service.begin = function(audioRecorder){

    service.audioRecorder = audioRecorder;

    service.audioRecorder.create(function (msg) {

      console.log('it is successful to create audio recorder');

    }, function (msg) {
      console.log("It fails to create an AudioRecorder");
      console.log(msg);
    });

    service.audioRecorder.start();

    // setInterval(service._pinpoint,2000);
    service._pinpoint();

  }

  service.end = function(){
    service.stopped = true;0
    service.totalFrames = 0;
    service.lastProgress = 0;
    service.errorFrames = 0;
    service.errors = 0;
    console.log("stop...");
  }

  service.loadLibrary = function(){
      return utilService.get("/lib");
  }

  service.registerObserver = function(callback){
    service.observers.push(callback);
  }

  service._notifyObservers = function(){
    for(var i=0;i<service.observers.length;i++){
      service.observers[i]();
    }
  };

  service._seekPreamble = function (signal) {
    console.log("seek preamble:"+signal.length);
    return utilService.post('/seekPreamble', {'signal': signal});
  }

  service._read = function(count, success, error){
    service.audioRecorder.read(count, function (block) {
      console.log("It is successful to read");
      success(block);
    },function(result){
        console.log(result);
    })

  }

  service._resolveSymbol = function (block, offset) {

    var correct = 10;

    var cor0 = 0.0;
    for(var j=-correct;j<correct;j++) {
      var temp = 0.0;
      for (var i = 0; i < configService.symbolLength; i++) {
        temp += block[i + j + offset] * chirpService.symbol_0[i];
      }
      temp = Math.abs(temp);
      if(temp > cor0){
        cor0 = temp;
      }
    }

    var cor1 = 0.0;
    for(var j=-correct;j<correct;j++) {
      var temp = 0.0;
      for (var i = 0; i < configService.symbolLength; i++) {
        temp += block[i + j+ offset] * chirpService.symbol_1[i];
      }
      temp = Math.abs(temp);
      if(temp > cor1){
        cor1 = temp;
      }
    }

    return cor0 > cor1 ? 0 : 1;
  }

  service._convertTime = function(second){
    var sec_num = parseInt(second, 10);
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
  }

  service._resolveContext = function (block, offset) {

    if(!offset) offset = 0;

    var context = [];
    for (var i = 0; i < configService.contextSize; i++) {
      context.push(service._resolveSymbol(block, offset+i*configService.symbolLength));
    }

    var progressStr = "";
    for (var i = 0; i < configService.progressSize; i++) {
      progressStr += context[i];
    }
    var progress = parseInt(progressStr, 2);

    var idStr = "";
    for (var i = 0; i < configService.contentSize; i++) {
      idStr += context[configService.progressSize+i];
    }
    var id = parseInt(idStr,2);


    var crcStr="";
    for(var i=0;i<configService.crcSize;i++){
      crcStr += context[configService.progressSize+configService.contentSize+i];
    }
    var crc = parseInt(crcStr,2);


    service.totalFrames ++ ;
    var calculatedCrc16 = crcService.check16(progressStr+idStr);
    if(calculatedCrc16 != crc){
        service.errorFrames ++;
        service.errors ++;
    }else{
      service.progress = progress;
      service.contentId = id;
      service.errors = 0;
    }

    service._notifyObservers();

    console.log("error rate:"+service.errorFrames/service.totalFrames);

    console.log(progressStr + " - " + idStr + " - " + crcStr);
    console.log(service._convertTime(progress)+"-"+id+"-"+crc);
    console.log("crc:"+calculatedCrc16+" - "+ crc);

  }


  service._resolveBlock = function (oldBlock, newBlock, algined) {


    var block = null;
    if (oldBlock) {
      block = oldBlock.concat(newBlock);
    } else {
      block = newBlock;
    }

    console.log("resolve block with length:"+block.length);

    //align the preamble
    // var offset = service.alignPreamble(block);
    // console.log("aligning preamble with offset:"+offset);



    var count = 0;
    var context = null;

    if(block.length == configService.frameLength){
      console.log("block length equals to that of a frame.");
      service._resolveContext(block,configService.preambleLength);
      if(service.errors>2){
        service.errors = 0;
        //relocate
        service._pinpoint();
      }else {

        if(service.stopped){
          service.audioRecorder.stop();
          return;
        }
        //next block
        service._read(configService.frameLength, function (newBlock) {
          service._resolveBlock(null, newBlock);
        })
      }
    } else if (block.length < configService.frameLength) {
      console.log('block length is less that of a frame.');
      count = configService.frameLength - block.length;
      service._read(count, function (newBlock) {
          service._resolveBlock(block, newBlock);
      })
    }else {
      console.log("block length is greater than that of a frame.");
      count = 2 * configService.frameLength - block.length;
      console.log(block.length-configService.frameLength);
      service._read(count, function (newBlock) {
          service._resolveBlock(block.slice(-(block.length-configService.frameLength)), newBlock);
      });
    }
  }

  //start to pinpoint the preamble
  service._pinpoint = function () {

    console.log("=========pinpoint preamble=============");

    console.log("Going to read block with length of "+configService.sampleRate*2);
    service._read(configService.frameLength*2, function (block) {

        console.log("read block from plugin:"+block.length);
        service._seekPreamble(block).then(function (correlation) {
          console.log("it successfully seek a preamble at server.");
          service.totalFrames=1;
          service.errorFrames=0;
          service._resolveBlock(null, block.slice(correlation.index));
        },function(result){
          console.log("it fails to see preamble at server.");
        });
    })
  }

  return service;

})
