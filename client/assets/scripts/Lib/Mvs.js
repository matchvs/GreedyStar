let engine;
let response = {};
//try {
//  engine = Matchvs.MatchvsEngine.getInstance();
//} catch (e) {
  //  console.log(e.code);
   // console.log(JSON.stringify(e))
    var jsMatchvs = require("matchvs.all");
    engine = new jsMatchvs.MatchvsEngine();
    response = new jsMatchvs.MatchvsResponse();
  //  jsMatchvs.LocalStore_Clear();
//}
module.exports = {
  engine: engine,
  response: response
};
