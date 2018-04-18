function MatchvsEngine() {
  console.log('MatchvsEngine init');
}

MatchvsEngine.prototype.init = function (response, channel, platform, gameid) {
  this.responses = [response];
  return 0;
};

MatchvsEngine.prototype.registerUser = function () {
  this._forEachResponse(function (res) {
    setTimeout(function () {
      var userInfo = {
        id: 1,
        token: 'asdfg',
        name: '1',
        avatar: 'http://d3819ii77zvwic.cloudfront.net/wp-content/uploads/2015/02/child-fist-pump.jpg',
        // tag
        tag: 1,
        // gold
        gold: 100
      };
      res.registerUserResponse && res.registerUserResponse(userInfo);
    }, 100);
  });
  return 0;
};

MatchvsEngine.prototype.login = function (userId, token, gameid, gameVersion, appkey, secret, deviceId, gatewayid) {
  this._forEachResponse(function (res) {
    setTimeout(function () {
      res && res.loginResponse({ status: 200, roomId: new Date().getTime() });
    }, 100);
  });
  return 0;
};

MatchvsEngine.prototype.joinRandomRoom = function () {
  this._forEachResponse(function (res) {
    setTimeout(function () {
      var info = {
        status: 200,
        userInfoList: [
          { userId: 2, userProfile: '2', gold: 5, score: 100 },
          { userId: 3, userProfile: '3', gold: 5, score: 200 },
          { userId: 4, userProfile: '4', gold: 5, score: 300 },
          // { userId: 5, userProfile: '5', gold: 5 },
        ],
        roomInfo: {
          roomId: 1028374,
          rootProperty: "好房间",
          // owner: 10086,
        }
      };
      res && res.joinRoomResponse(info.status, info.userInfoList, info.roomInfo);
    }, 100);
  });
  return 0;
};

MatchvsEngine.prototype._forEachResponse = function (func) {
  if (this.responses) {
    for (var i = 0; i < this.responses.length; i++) {
      this.responses[i] && func(this.responses[i]);
    }
  }
  //func(this);
};

MatchvsEngine.prototype.joinOver = function () {
  return 0;
};

MatchvsEngine.prototype.sendEvent = function (event) {
  var mockEventId = new Date().getTime();
  this._forEachResponse(function (res) {
    setTimeout(function () {
      res.sendEventResponse && res.sendEventResponse({ status: 200, sequence: mockEventId });
    }, 100);
  });
  return { result: 0, sequence: mockEventId };
};

module.exports = MatchvsEngine;