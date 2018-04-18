let engine;
let response = {};
try {
  engine = Matchvs.MatchvsEngine.getInstance();
} catch (e) {
  try {
    let jsMatchvs = require("matchvs.all");
    engine = new jsMatchvs.MatchvsEngine();
    response = new jsMatchvs.MatchvsResponse();
    jsMatchvs.LocalStore_Clear();
  } catch (e) {
    let MatchVSEngine = require('MatchvsEngine');
    engine = new MatchVSEngine();
  }
}
module.exports = {
  engine: engine,
  response: response
};
