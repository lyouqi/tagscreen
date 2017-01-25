

app.service("configService",function(chirpService){

  return {

    server: "175.159.22.27",

    port:"9093",

    /*****Begin chirp*******/

    sampleRate: 44100,

    frameLength: 44100,

    preambleLength: chirpService.preamble.length,

    redundancyLength: 500,

    symbolLength: chirpService.symbol_0.length,

    contextLength: chirpService.symbol_0.length*44,

    contextSize: 44, //including 14 bits for progress and 30 for content id.

    progressSize: 14,

    contentSize: 14,

    crcSize:16

    /*****End Chirp*******/
  }

})
