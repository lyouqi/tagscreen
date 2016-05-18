app.service('dataService', function (utilService, chirpService, configService) {

  var service = {}

  service.errors = 0;
  service.lastProgress = 0;

  service.begin = function(audioRecorder){

    service.audioRecorder = audioRecorder;

    service.audioRecorder.create(function (msg) {

      console.log('it is successful to create audio recorder');

    }, function (msg) {
      console.log("It fails to create an AudioRecorder");
      console.log(msg);
    });

    service.audioRecorder.start();

    // setInterval(service.pinpoint,2000);
    service.pinpoint();

  }

  service.end = function(){
    service.stopped = true;
    console.log("stop...");
  }

  service.seekPreamble = function (signal) {
    console.log("seek preamble:"+signal.length);
    return utilService.post('/seekPreamble', {'signal': signal});
  }

  service.read = function(count, success, error){
    service.audioRecorder.read(count, function (block) {
      console.log("It is successful to read");
      success(block);
    },function(result){
        console.log(result);
    })

  }

  service.resolveSymbol = function (block, offset) {

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

  service.resolveContext = function (block, offset) {

    if(!offset) offset = 0;

    var context = [];
    for (var i = 0; i < configService.contextSize; i++) {
      context.push(service.resolveSymbol(block, offset+i*configService.symbolLength));
    }

    var progress = "";
    for (var i = 0; i < configService.progressSize; i++) {
      progress += context[i];
    }
    progress = parseInt(progress, 2);

    var id = "";
    for (var i = 0; i < configService.contentSize; i++) {
      id += context[configService.progressSize+i];
    }

    if(service.lastProgress == -1){
        service.lastProgress = progress;
    }

    console.log("progress:"+progress+"-"+service.lastProgress);
    console.log("different:"+Math.abs(progress-service.lastProgress));
    if(Math.abs(progress-service.lastProgress)>5){
        service.errors ++;
    }else{
        service.errors = 0;
    }

    service.lastProgress = progress;


    console.log(progress+":"+id+":");


  }

  service.alignPreamble = function(block){

    var offset = 0;
    var maxcor = -1;
    for(var i=0;i<configService.preambleLength/2;i++){
      var cor = 0;
      for(var j=0;j<configService.preambleLength;j++){
          cor = chirpService.preamble[j]*block[i+j];
       }
      cor = Math.abs(cor)/configService.preambleLength;
      if(cor > maxcor){
        maxcor = cor;
        offset = i;
      }
    }

    return offset;

  }

  service.resolveBlock = function (oldBlock, newBlock, algined) {


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
      service.resolveContext(block,configService.preambleLength);
      if(service.errors>5){
        //relocate
        service.pinpoint();
      }else {

        if(service.stopped){
          service.audioRecorder.stop();
          return;
        }
        //next block
        service.read(configService.frameLength, function (newBlock) {
          service.resolveBlock(null, newBlock);
        })
      }
    } else if (block.length < configService.frameLength) {
      console.log('block length is less that of a frame.');
      count = configService.frameLength - block.length;
      service.read(count, function (newBlock) {
          service.resolveBlock(block, newBlock);
      })
    }else {
      console.log("block length is greater than that of a frame.");
      count = 2 * configService.frameLength - block.length;
      console.log(block.length-configService.frameLength);
      service.read(count, function (newBlock) {
          service.resolveBlock(block.slice(-(block.length-configService.frameLength)), newBlock);
      });
    }
  }

  //start to pinpoint the preamble
  service.pinpoint = function () {

    console.log("=========pinpoint preamble=============");

    console.log("Going to read block with length of "+configService.sampleRate*2);
    service.read(configService.frameLength*2, function (block) {

        service.progress = -1;
        service.errors = 0;

        console.log("read block from plugin:"+block.length);
        service.seekPreamble(block).then(function (correlation) {
          console.log("it successfully seek a preamble at server.");
          service.resolveBlock(null, block.slice(correlation.index));
        },function(result){
          console.log("it fails to see preamble at server.");
        });
    })
  }

  return service;

})
