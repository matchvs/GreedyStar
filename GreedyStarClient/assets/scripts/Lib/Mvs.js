let engine;
let response = {};
try {
    var jsMatchvs = require("matchvs.all");
    engine = new jsMatchvs.MatchvsEngine();
    response = new jsMatchvs.MatchvsResponse();
} catch (e) {
   console.log("load matchvs js fail:"+e.message);
}
module.exports = {
  engine: engine,
  response: response
};
