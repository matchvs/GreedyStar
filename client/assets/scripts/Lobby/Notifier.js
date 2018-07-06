let Mvs = require('../Lib/Mvs');
let Const = require('../Const/Const');
let Config = require('../Global/Config');
let GameData = require("../Global/GameData");

cc.Class({
    extends: cc.Component,

    start() {
        cc.game.addPersistRootNode(this.node);
        this.mvsBind()
    },

    mvsBind() {
        Mvs.response.joinRoomNotify = this.mvsJoinRoomNotify.bind(this);
        Mvs.response.leaveRoomNotify = this.mvsLeaveRoomNotify.bind(this);
    },

    mvsJoinRoomNotify(userInfo) {
        // TODO: 合并

        
        if (GameData.isQuickJoinBtnClick === true) {
            for (let i = 0, l = GameData.players.length; i < l; i++) {
                if (userInfo.userId === GameData.players[i].userId) {
                    console.error('userId has in GameData.players');
                    console.error('GameData.players', GameData.players);
                    console.error('userId', userInfo.userId);
                    return;
                }
            }

            GameData.players.push({
                userId: userInfo.userId,
                userName: userInfo.userProfile,
                score: 0
            });

            if (GameData.isGameStart === false) {
                let l = GameData.players.length;
                let nodes = cc.find('Canvas/stage2/boxRoom/playerList').children;
                let label = nodes[l - 1].getChildByName('username').getComponent(cc.Label);
                // label.string = GameData.players[l - 1].userId;
                label.string = GameData.players[l - 1].userName;
            }

            else if (GameData.isGameStart === true) {
                // 游戏已经开始, 玩家中途加入
                // 延迟4秒

                // 延迟200ms,发送'房间内有用户'的事件
                setTimeout(() => {
                    // 至少应该有一个人发
                    let data = JSON.stringify({
                        event: Const.USER_IN_THE_ROOM,
                        isClient: true,
                        isGameStart: true,
                        toUserId: userInfo.userId,

                    });
                    let result = Mvs.engine.sendEvent(data);
                    if (result.result === 0) {
                        console.log('sdk sendEvent "USER_IN_THE_ROOM"(game is start) ok', result);
                    } else {
                        console.error('sdk sendEvent "USER_IN_THE_ROOM"(game is start) error', result);
                    }
                }, 200);

                setTimeout(() => {
                    this.emitNewPlayer({
                        userId: userInfo.userId
                    })
                }, 200);

                setTimeout(() => {
                    let tempArr = [];

                    for (let i = 0, l = GameData.foodArr.length; i < l; i++) {
                        // console.log('GameData.foodArr', GameData.foodArr);
                        // console.log('GameData.foodArr[i][2]', GameData.foodArr[i][2]);

                        let foodIdArr = GameData.foodArr[i][2].split('f');
                        if (foodIdArr[0] === String(Const.userId)) {
                            tempArr.push(GameData.foodArr[i])
                        }
                    }

                    // return;


                    let data = JSON.stringify({
                        event: Const.OTHERS_ADD_FOODS_EVENT,
                        isClient: true,
                        toUserId: userInfo.userId,
                        foodArr: tempArr,
                        isGameStart: true,
                    });

                    let result = Mvs.engine.sendEvent(data);
                    if (result.result === 0) {
                        console.log('sdk sendEvent "OTHERS_ADD_FOODS"(game is start) ok', result);
                    } else {
                        console.error('sdk sendEvent "OTHERS_ADD_FOODS"(game is start) error', result);
                    }
                }, 2000);

                setTimeout(() => {

                    // TODO es6扩展运行符
                    // let playerStatusData = [];
                    // for (let i = 0, l = GameData.players.length; i < l; i++) {
                    //     // TODO 应该去除一个
                    //     playerStatusData.push({
                    //         userId: GameData.players[i].userId,
                    //         score: GameData.players[i].score,
                    //         x: GameData.players[i].x,
                    //         y: GameData.players[i].y,
                    //         scale: GameData.players[i].scale,
                    //         opacity: GameData.players[i].opacity,
                    //         isLive: GameData.players[i].isLive,
                    //         isInvin: GameData.players[i].isInvin,
                    //     })
                    // }

                    let data = JSON.stringify({
                        event: Const.GAME_START_EVENT_BY_HALF,
                        time: GameData.gameTime,
                        toUserId: userInfo.userId,
                        isClient: true,
                        isGameStart: true,
                    });

                    let result = Mvs.engine.sendEvent(data);
                    if (result.result === 0) {
                        console.log('sdk sendEvent "GAME_START_EVENT_BY_HALF"(game is start) ok', result);
                    } else {
                        console.error('sdk sendEvent "GAME_START_EVENT_BY_HALF"(game is start) error', result);
                    }
                }, 200);

                setTimeout(() => {

                    let playerStatusData = {
                        userId: GameData.players[0].userId,
                        score: GameData.players[0].score,
                        x: GameData.players[0].x,
                        y: GameData.players[0].y,
                        scale: GameData.players[0].scale,
                        opacity: GameData.players[0].opacity,
                        isLive: GameData.players[0].isLive,
                        isInvin: GameData.players[0].isInvin,
                    }

                    let data = JSON.stringify({
                        event: Const.OTHERS_BIRTH_EVENT,
                        toUserId: userInfo.userId,
                        data: playerStatusData,
                        isClient: true,
                        isGameStart: true,
                    });


                    let result = Mvs.engine.sendEvent(data);
                    if (result.result === 0) {
                        console.log('sdk sendEvent "OTHERS_BIRTH_EVENT"(game is start) ok', result);
                    } else {
                        console.error('sdk sendEvent "OTHERS_BIRTH_EVENT"(game is start) error', result);
                    }
                }, 2000);
            }
        }

        else if (GameData.isCreateRoomBtnClick === true || GameData.isJoinRoomBtn2Click === true || GameData.isRoomItemClick) {
            for (let i = 0, l = GameData.players.length; i < l; i++) {
                if (userInfo.userId === GameData.players[i].userId) {
                    console.error('userId has in GameData.players');
                    console.error('GameData.players', GameData.players);
                    console.error('userId', userInfo.userId);
                    return;
                }
            }

            GameData.players.push({
                userId: userInfo.userId,
                userName: userInfo.userProfile,
                score: 0
            });

            if (GameData.isGameStart === false) {
                let l = GameData.players.length;
                let nodes = cc.find('Canvas/stage2/boxRoom/playerList').children;
                let label = nodes[l - 1].getChildByName('username').getComponent(cc.Label);
                // label.string = GameData.players[l - 1].userId
                label.string = GameData.players[l - 1].userName
            }

            else if (GameData.isGameStart === true) {
                // 游戏已经开始, 玩家中途加入
                // 延迟4秒

                // 延迟200ms,发送'房间内有用户'的事件
                setTimeout(() => {
                    // 至少应该有一个人发
                    let data = JSON.stringify({
                        event: Const.USER_IN_THE_ROOM,
                        isClient: true,
                        isGameStart: true,
                        toUserId: userInfo.userId,

                    });
                    let result = Mvs.engine.sendEvent(data);
                    if (result.result === 0) {
                        console.log('sdk sendEvent "USER_IN_THE_ROOM"(game is start) ok', result);
                    } else {
                        console.error('sdk sendEvent "USER_IN_THE_ROOM"(game is start) error', result);
                    }
                }, 200);

                setTimeout(() => {
                    this.emitNewPlayer({
                        userId: userInfo.userId
                    })
                }, 200);


                setTimeout(() => {
                    let tempArr = [];

                    for (let i = 0, l = GameData.foodArr.length; i < l; i++) {
                        let foodIdArr = GameData.foodArr[i][2].split('f');
                        if (foodIdArr[0] === String(Const.userId)) {
                            tempArr.push(GameData.foodArr[i])
                        }
                    }

                    let data = JSON.stringify({
                        event: Const.OTHERS_ADD_FOODS_EVENT,
                        isClient: true,
                        toUserId: userInfo.userId,
                        foodArr: tempArr,
                        isGameStart: true,
                    });

                    let result = Mvs.engine.sendEvent(data);
                    if (result.result === 0) {
                        console.log('sdk sendEvent "OTHERS_ADD_FOODS"(game is start) ok', result);
                    } else {
                        console.error('sdk sendEvent "OTHERS_ADD_FOODS"(game is start) error', result);
                    }
                }, 2000)

                setTimeout(() => {
                    let data = JSON.stringify({
                        event: Const.GAME_START_EVENT_BY_HALF,
                        time: GameData.gameTime,
                        // data: playerStatusData,
                        toUserId: userInfo.userId,
                        isClient: true,
                        isGameStart: true,
                        // foodArr: GameData.foodArr
                        // foodArr: []
                    });

                    let result = Mvs.engine.sendEvent(data);
                    if (result.result === 0) {
                        console.log('sdk sendEvent "GAME_START_EVENT_BY_HALF"(game is start) ok', result);
                    } else {
                        console.error('sdk sendEvent "GAME_START_EVENT_BY_HALF"(game is start) error', result);
                    }
                }, 200);

                setTimeout(() => {

                    let playerStatusData = {
                        userId: GameData.players[0].userId,
                        score: GameData.players[0].score,
                        x: GameData.players[0].x,
                        y: GameData.players[0].y,
                        scale: GameData.players[0].scale,
                        opacity: GameData.players[0].opacity,
                        isLive: GameData.players[0].isLive,
                        isInvin: GameData.players[0].isInvin,
                    }

                    let data = JSON.stringify({
                        event: Const.OTHERS_BIRTH_EVENT,
                        toUserId: userInfo.userId,
                        data: playerStatusData,
                        isClient: true,
                        isGameStart: true,
                    });


                    let result = Mvs.engine.sendEvent(data);
                    if (result.result === 0) {
                        console.log('sdk sendEvent "OTHERS_BIRTH_EVENT"(game is start) ok', result);
                    } else {
                        console.error('sdk sendEvent "OTHERS_BIRTH_EVENT"(game is start) error', result);
                    }
                }, 2000);
            }
        }

        this.consoleGameData();
    },

    // mvsLeaveRoomNotify(roomId, roomUserInfo) {
    mvsLeaveRoomNotify(roomInfo) {
        if (GameData.isGameStart === true) {
            return;
        }
        console.log('leaveRoomNotify', roomInfo);
        let leaveUserId = roomInfo.userId; // 离开者id
        let ownerId = roomInfo.owner; // 新旧房主id

        let leaveUserIsOwner = leaveUserId === GameData.ownerId;

        if (leaveUserIsOwner === true) {
            let nodes = cc.find('Canvas/stage2/boxRoom/playerList').children;

            let k = 0;
            for (let i = 0, l = GameData.players.length; i < l; i++) {
                if (leaveUserId === GameData.players[i].userId) {
                    k = i;
                    break
                }
            }
            GameData.players.splice(k, 1);
            console.log('他人离开房间之后,检测下GameData', GameData);

            GameData.ownerId = ownerId;
            GameData.isOwner = ownerId === Const.userId;

            let players = [];
            for (let i = 0, l = GameData.players.length; i < l; i++) {
                let player = GameData.players[i];
                players[i] = {};
                players[i].userId = player.userId;
                players[i].userName = player.userName;
            }

            if (GameData.isOwner === false) {
                let k = 0;
                for (let i = 0, l = players.length; i < l; i++) {
                    let player = players[i];
                    if (player.userId === GameData.ownerId) {
                        k = i;
                        break
                    }
                }

                let mePlayer = players[0];
                players[0] = players[k];
                players[k] = mePlayer;
            }

            for (let i = 0, j = players.length; i < 6; i++) {
                let node = nodes[i];
                let label = node.getChildByName('username').getComponent(cc.Label);
                if (i < j) {
                    // label.string = players[i].userId;
                    label.string = players[i].userName;
                } else {
                    label.string = '--';
                }
            }

            if (GameData.isJoinRoomBtn2Click === true || GameData.isRoomItemClick === true) {
                if (GameData.isOwner === true) {
                    let startBtn = cc.find('Canvas/stage2/boxRoom/btnStartGame');
                    startBtn.active = true;

                    //  Canvas/stage2/boxRoom/playerList/playerItem/btn
                    let nodes = cc.find('Canvas/stage2/boxRoom/playerList').children;
                    for (let i = 1, l = nodes.length; i < l; i++) {
                        let node = nodes[i];
                        let kickBtn = node.getChildByName('btn');
                        kickBtn.active = true;
                    }
                }
            }
        }

        else {
            let k = 0;
            for (let i = 0, l = GameData.players.length; i < l; i++) {
                if (leaveUserId === GameData.players[i].userId) {
                    k = i;
                    break
                }
            }
            GameData.players.splice(k, 1);

            let j = GameData.players.length;
            let nodes = cc.find('Canvas/stage2/boxRoom/playerList').children;

            if (GameData.isOwner === true) {

                for (let i = 0; i < 6; i++) {
                    let node = nodes[i];
                    let label = node.getChildByName('username').getComponent(cc.Label);
                    if (i < j) {
                        // label.string = GameData.players[i].userId;
                        label.string = GameData.players[i].userName;
                    } else {
                        label.string = '--';
                    }

                }
            }

            else {
                let players = [];

                for (let i = 0, l = GameData.players.length; i < l; i++) {
                    let _player = GameData.players[i];
                    players[i] = {};

                    players[i].userId = _player.userId;
                    players[i].userName = _player.userName;
                }

                let j = players.length;
                let k = 0;

                for (let i = 0; i < j; i++) {
                    let _player = players[i];
                    if (_player.userId === GameData.ownerId) {
                        k = i;
                        break;
                    }
                }

                let mePlayer = players[0];
                players[0] = players[k];
                players[k] = mePlayer;

                for (let i = 0; i < 6; i++) {
                    let node = nodes[i];
                    let label = node.getChildByName('username').getComponent(cc.Label);
                    if (i < j) {
                        // label.string = players[i].userId;
                        label.string = players[i].userName;
                    } else {
                        label.string = '--';
                    }
                }
            }
        }

        this.consoleGameData();
    },

    consoleGameData() {
        if (Config.isDebug === true) {
            console.log('=================');
            console.warn('GameData', GameData);
            console.log('=================');
        }
    },

    emitNewPlayer(data) {
        cc.director.GlobalEvent.emit('newPlayer', data)
    },
});
