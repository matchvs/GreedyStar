var Const = require('../Const/Const');
var Config = require('../Global/Config');
var GameData = require('../Global/GameData');
var msg = require("../Lib/MatvhvsMessage");
var engine = require("../Lib/MatchvsEngine");
var response = require("../Lib/MatchvsDemoResponse");


cc.Class({
    extends: cc.Component,

    properties: {
        promptSetTimeout: null,
        promptAction: null,
        userNameNode: cc.Label,
        goldNode: cc.Label,
        userIDNode: cc.Label,
        userNameNode2: cc.Label,
        allValueNode: cc.Label,
        winValueNode: cc.Label,
        isAddDesignatedRooms: false,
        getRoomListTimer: undefined,
        players: [],
        ownereID: 0,
    },


    onLoad: function () {
        // cc.director.setDisplayStats(false);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        //Matchvs事件监听
        this.mvsBind(this);
        this.node.removeChild();
        // 展示头像
        this.loadAvatarImage(Const.avatarUrl);
        this.initProfileData();
        this.getRoomList();
    },

    onKeyDown: function (event) {
        switch (event.keyCode) {
            case 1005:
                console.log('开始随机匹配');
                this.quickJoinBtnHandler();
                break;
            case 6:
                this.backBtnHandler();
                break;
        }
    },


    mvsBind: function (self) {
        response.prototype.init(self);
        this.node.on(msg.MATCHVS_LOGOUT, this.onEvent, this);
        this.node.on(msg.MATCHVS_ROOM_DETAIL, this.onEvent, this);
        this.node.on(msg.MATCHVS_ROOM_LIST_EX, this.onEvent, this);
        this.node.on(msg.MATCHVS_JOIN_ROOM_RSP, this.onEvent, this);
        this.node.on(msg.MATCHVS_JOIN_ROOM_NOTIFY, this.onEvent, this);
        this.node.on(msg.MATCHVS_CREATE_ROOM, this.onEvent, this);
        this.node.on(msg.MATCHVS_LEAVE_ROOM, this.onEvent, this);
        this.node.on(msg.MATCHVS_LEAVE_ROOM_NOTIFY, this.onEvent, this);
        this.node.on(msg.MATCHVS_KICK_PLAYER, this.onEvent, this);
        this.node.on(msg.MATCHVS_KICK_PLAYER_NOTIFY, this.onEvent, this);
        this.node.on(msg.MATCHVS_SEND_EVENT_NOTIFY, this.onEvent, this);
        this.node.on(msg.MATCHVS_SEND_EVENT_RSP, this.onEvent, this);
        this.node.on(msg.MATCHVS_NETWORK_STATE_NOTIFY, this.onEvent, this);
        cc.systemEvent.on(msg.ADD_DESIGNATED_ROOMS, this.onEvent, this);
        //todo 新增
        this.node.on(msg.MATCHVS_GAME_SERVER_NOTIFY, this.onEvent, this);
    },

    /**
     * 判断自己是否是房主
     * @param ownerID
     */
    isOwner: function (ownerID) {
        if (ownerID === Const.userID) {
            GameData.isOwner = true;
            this.showSomeRoomViewBtn();
        } else {
            GameData.isOwner = false;
            this.hideSomeRoomViewBtn();
        }
    },

    /**
     * 接收MatchvsSdk事件
     * @param event
     */
    onEvent: function (event) {
        var eventData = event.detail;
        if (eventData == undefined) {
            eventData = event;
        }
        switch (event.type) {
            case msg.MATCHVS_LOGOUT:
                if (eventData.status !== 200) {
                    this.showPromptOfError('注销失败 请重试', true);
                } else {
                    this.showPromptOfError("", false);
                    cc.director.loadScene('cover');
                }
                break;
            case msg.MATCHVS_ROOM_DETAIL:
                break;
            case msg.MATCHVS_NETWORK_STATE_NOTIFY:
                this.mvsNetworkStateNotify(eventData.netNotify);
                break;
            case msg.MATCHVS_ROOM_LIST_EX:
                this.updateRoomItem(eventData.rsp.roomAttrs);
                break;
            case msg.MATCHVS_JOIN_ROOM_NOTIFY:
                this.players.push({
                    userID: eventData.roomUserInfo.userID,
                    userName: JSON.parse(eventData.roomUserInfo.userProfile).profile,
                });
                //joinRoomNotify 不涉及房主变更，房主ID传0。
                this.roomUserListChangeNotify(this.players, this.ownerID);
                break;
            case msg.MATCHVS_JOIN_ROOM_RSP:
                if (!GameData.GameMode) {
                    this.shouldStartGame();
                } else {
                    var label = cc.find('Canvas/stage2/boxRoom/title').getComponent(cc.Label);
                    this.ownerID = eventData.userInfoList.owner;
                    label.string = '房间ID: ' + eventData.userInfoList.roomID;
                    for (var i = 0; i < eventData.userInfoList.length; i++) {
                        this.players.push({
                            userID: eventData.userInfoList[i].userID,
                            userName: JSON.parse(eventData.userInfoList[i].userProfile).profile,
                        });
                    }
                    this.players.push({
                        userID: Const.userID,
                        userName: Const.userName,
                    });
                    this.showRoomView();
                    this.roomUserListChangeNotify(this.players, this.ownerID);
                }
                break;
            case msg.MATCHVS_CREATE_ROOM:

                var label1 = cc.find('Canvas/stage2/boxRoom/title').getComponent(cc.Label);
                label1.string = '房间ID: ' + eventData.rsp.roomID;
                this.ownerID = eventData.rsp.owner
                this.players.push({
                    userID: Const.userID,
                    userName: Const.userName,
                });
                this.showRoomView();
                this.roomUserListChangeNotify(this.players, this.ownerID);
                break;
            case msg.MATCHVS_LEAVE_ROOM:
                // if (GameData.GameMode) {
                if (eventData.leaveRoomRsp.status !== 200) {
                    this.showPromptOfError('离开房间失败', true);
                }
                this.players.length = 0;
                this.hideRoomView();
                var roomListNode = cc.find('Canvas/stage1/scrollview/view/roomList');
                roomListNode.removeAllChildren(true);
                // }

                break;
            case msg.MATCHVS_LEAVE_ROOM_NOTIFY:
                if (GameData.GameMode) {
                    this.ownerID = eventData.leaveRoomInfo.owner;
                    for (var i = 0; i < this.players.length; i++) {
                        if (this.players[i].userID === eventData.leaveRoomInfo.userID) {
                            this.players.splice(i, 1);
                        }
                    }
                    this.roomUserListChangeNotify(this.players, this.ownerID);
                }
                break;
            case msg.MATCHVS_KICK_PLAYER:
                if (eventData.kickPlayerRsp.status === 200) {
                    this.ownerID = eventData.kickPlayerRsp.owner;
                    for (var i = 0; i < this.players.length; i++) {
                        if (this.players[i].userID === eventData.kickPlayerRsp.userID) {
                            this.players.splice(i, 1);
                        }
                    }
                    this.roomUserListChangeNotify(this.players, this.ownerID);
                }
                break;
            case msg.MATCHVS_KICK_PLAYER_NOTIFY:
                if (Const.userID === eventData.kickPlayerNotify.userID) {
                    this.players.length = 0;
                    this.hideRoomView();
                    break;
                }
                this.ownerID = eventData.KickPlayerNotify.owner;
                for (var i = 0; i < this.players.length; i++) {
                    if (this.players[i].userID === eventData.kickPlayerNotify.userID) {
                        this.players.splice(i, 1);
                    }
                }
                this.roomUserListChangeNotify(this.players, this.ownerID);
                break;
            case msg.MATCHVS_SEND_EVENT_NOTIFY:
                if (JSON.parse(eventData.eventInfo.cpProto).event === Const.GAME_START_EVENT) {
                    this.shouldStartGame();
                }
                break;
            case msg.ADD_DESIGNATED_ROOMS:
                var userProfile = Const.userName;
                GameData.GameMode = true;
                var result = engine.prototype.joinRoom(event.roomID, userProfile);
                if (result !== 0) {
                    this.showPromptOfError('加入房间[sdk]失败 请刷新 重试', true);
                }
                break
        }
    },


    /**
     * 创建房间按钮点击事件
     */
    createRoomBtnHandler: function () {
        this.isshowUserProfileLayer(false);
        var create = new MsCreateRoomInfo('', 6, 0, 0, 1, '');
        var userProfile = Const.userName;
        var result = engine.prototype.createRoom(create, userProfile);
        if (result !== 0) {
            this.showPromptOfError('创建房间[sdk]失败 请刷新 重试', true);
        }
    },

    /**
     * 加入按钮 点击事件
     */
    joinRoomBtn2Hanlder: function () {
        var editBox = cc.find('Canvas/stage1/layerJoin/editbox');
        var editBoxString = editBox.getComponent(cc.EditBox).string;
        var roomID = editBoxString;
        var patt = /[^0-9]/;
        if (patt.test(roomID) || roomID === "") {
            this.showPrompt('请输入正确的房间号');
            return;
        }
        var userProfile = Const.userName;
        var result = engine.prototype.joinRoom(roomID, userProfile);
        if (result !== 0) {
            this.showPromptOfError('加入房间[sdk]失败 请刷新 重试', true);
        }
    },

    /**
     * 非房间页面退出点击事件
     */
    mvsLogoutBtn: function () {
        var result = engine.prototype.logout();
        if (result !== 0) {
            console.error('sdk logout error', result);
            this.showPromptOfError('注销[sdk]失败 请刷新 重试', true);
        }
    },

    mvsNetworkStateNotify: function (notifyData) {
        var userID = notifyData.userID;
        if (notifyData.state === 1) {
            if (GameData.isOwner) {
                this.showPrompt('有玩家掉线 自动踢掉');
                var result = engine.prototype.kickPlayer(userID, "")
                if (result !== 0) {
                    this.showPromptOfError('踢人[sdk]失败 请刷新 重试', true);
                }
            } else {
                // 如果房主异常, 其他人就离开房间
                if (userID === notifyData.ownerID) {
                    this.showPrompt('房主掉线 自动离开房间');
                    this.leaveRoomBtnHandler();
                } else {
                    this.showPrompt('有玩家掉线 自动踢掉');
                }
            }
        }
    },

    /**
     * 首页展示房间列表
     * @param roomInfo
     */
    updateRoomItem: function (roomInfo) {
        var roomListNode;
        try {
            roomListNode = cc.find('Canvas/stage1/scrollview/view/roomList');
            roomListNode.removeAllChildren(true);
        } catch (error) {
            console.error('roomList node removeAllChildren error', error);
            return;
        }
        cc.loader.loadRes("prefab/roomItem", function (err, res) {
            if (err) {
                console.error('load prefab/roomItem error', err);
                return;
            }
            for (var i = 0, l = roomInfo.length; i < l; i++) {
                var roomId = roomInfo[i].roomID;
                var roomItemNode = cc.instantiate(res);
                roomItemNode.roomId = roomId;
                roomItemNode.y = -94 * i;
                roomItemNode.parent = roomListNode;
            }
        })
    },


    showPrompt: function (str) {
        var promptNode = cc.find('Canvas/prompt');
        var promptTxt = promptNode.getChildByName('label').getComponent(cc.Label);
        promptTxt.string = str;
        if (this.promptSetTimeout !== null) {
            clearTimeout(this.promptSetTimeout);
        }
        if (this.promptAction !== null) {
            promptNode.stopAction(this.promptAction);
        }
        promptNode.active = true;
        promptNode.opacity = 255;
        this.promptSetTimeout = setTimeout(function () {
            if (GameData.isGameStart === false) {
                this.promptAction = cc.fadeOut(5.0);
                promptNode.runAction(this.promptAction);
                promptNode.active = false;
            }
        }, 1000);
    },

    mvsErrorResponse: function (code, errMsg) {
        this.resetSomeGameData();
        if (code === 1001) {
            GameData.isServerErrorCode1000 = true;
            this.showPromptOfError('你已掉线 请刷新 重开', true);
            this.showPromptOfError('', false);
            cc.director.loadScene('Cover');
        } else if (code === 404) {
            this.showPrompt("该房间不能加入");
        }
    },

    showPromptOfError: function (str, isShow) {
        var promptNode = cc.find('Canvas/prompt');
        if (isShow) {
            var promptTxt = promptNode.getChildByName('label').getComponent(cc.Label);
            promptTxt.string = str;
            promptNode.active = true;
        } else {
            promptNode.active = false;
        }
    },


    initProfileData: function () {
        this.userNameNode.string = Const.userName;
        this.goldNode.string = GameData.gold;
        this.userIDNode.string = '昵称: ' + Const.userName;
        this.userNameNode2.string = '用户ID:  ' + Const.userID;
        this.allValueNode.string = GameData.allValue;
        this.winValueNode.string = GameData.winValue;
    },


    /**
     *
     * @param avatarUrl 玩家头像地址
     */
    loadAvatarImage: function (avatarUrl) {
        var avatarNode = cc.find('Canvas/profile/avator');
        var sprite = avatarNode.getComponent(cc.Sprite);
        if (typeof(wx) !== "undefined") {
            var image = wx.createImage();
            image.onload = function () {
                try {
                    var texture = new cc.Texture2D();
                    texture.initWithElement(image);
                    texture.handleLoadedTexture();
                    sprite.spriteFrame = new cc.SpriteFrame(texture);
                } catch (e) {
                    console.log('wx onload image error');
                }
            }
            image.src = avatarUrl;
        } else {
            cc.loader.load(avatarUrl, function (err, res) {
                if (err) {
                    console.error('load avatar image error', err);
                    return;
                }
                sprite.spriteFrame = new cc.SpriteFrame(res);
            });
        }
    },


    // 是否展示用户详细
    isshowUserProfileLayer: function (isShow) {
        var layerProfile = cc.find('Canvas/stage1/layerProfile');
        layerProfile.active = isShow;
    },


    // 返回按钮,隐藏用户信息
    closeUserProfileLayer: function () {
        this.isshowUserProfileLayer(false);
    },

    // 获取房间列表
    getRoomList: function () {
        if (this.getRoomListTimer === undefined) {
            this.getRoomListTimer = setInterval(function () {
                var filter = new MsRoomFilterEx(6, 0, 0, null, 0, 1, 2);
                engine.prototype.getRoomListEx(filter);
            }, 5000);
        }
    },


    /**
     * 随机加入,快速加入
     */
    quickJoinBtnHandler: function () {
        GameData.GameMode = false;
        this.isshowUserProfileLayer(false);
        var maxPlayer = 8;
        var userProfile = Const.userName;
        var result = engine.prototype.joinRandomRoom(maxPlayer, userProfile);
        if (result !== 0) {
            this.showPromptOfError("随机加入房间[sdk]失败 请刷新 重试", true);
        }


    },

    /**
     * 加入房间
     */
    joinRoomBtn1Hanlder: function () {
        this.isshowUserProfileLayer(false);
        this.showJoinRoomLayer(true);
    },

    closeJoinRoomLayer: function () {
        this.showJoinRoomLayer(false);
    },

    showJoinRoomLayer: function (isShow) {
        var joinRoomLayer = cc.find('Canvas/stage1/layerJoin');
        joinRoomLayer.active = isShow;
    },


    leaveRoomBtnHandler: function () {
        var countdownTxt = cc.find('Canvas/stage2/boxRoom/txtCountdown/countdown').getComponent(cc.Label);
        countdownTxt.string = '';
        var txt = cc.find('Canvas/stage2/boxRoom/txtCountdown/txt').getComponent(cc.Label);
        txt.string = '等待开始游戏(至少3人)';
        var result = engine.prototype.leaveRoom("");
        clearInterval(this.getRoomDetailTimer);
        //tdo
    },

    showSomeRoomViewBtn: function () {
        var startBtn = cc.find('Canvas/stage2/boxRoom/btnStartGame');
        startBtn.active = true;
        var nodes = cc.find('Canvas/stage2/boxRoom/playerList').children;
        for (var i = 1, l = nodes.length; i < l; i++) {
            var node = nodes[i];
            var kickBtn = node.getChildByName('btn');
            kickBtn.active = true;
        }
    },

    hideSomeRoomViewBtn: function () {
        var startBtn = cc.find('Canvas/stage2/boxRoom/btnStartGame');
        startBtn.active = false;
        var nodes = cc.find('Canvas/stage2/boxRoom/playerList').children;
        for (var i = 1, l = nodes.length; i < l; i++) {
            var node = nodes[i];
            var kickBtn = node.getChildByName('btn');
            kickBtn.active = false;
        }
    },


    // 展示stage2,隐藏stage1
    showRoomView: function () {
        clearInterval(this.getRoomListTimer);
        this.getRoomListTimer = undefined;
        var stage1 = cc.find('Canvas/stage1');
        stage1.active = false;
        var stage2 = cc.find('Canvas/stage2');
        stage2.active = true;
    },

    /**
     * 房间内玩家数组变化排序
     * @param userInfos
     * @param owner
     */
    roomUserListChangeNotify: function (userInfos, owner) {
        this.isOwner(owner);
        userInfos.sort(this.sortNumber);
        for (var i = 0; i < userInfos.length; i++) {
            if (owner === userInfos[i].userID) {
                this.swapArray(userInfos, i, 0);
            }
        }
        this.updateRoomView(userInfos);
    },

    /**
     * 排序
     * @param obj1
     * @param obj2
     * @returns {number}
     */
    sortNumber: function (obj1, obj2) {
        var userID1 = obj1.userID;
        var userID2 = obj2.userID;
        if (userID1 < userID2) {
            return -1;
        } else if (userID1 > userID2) {
            return 1;
        } else {
            return 0;
        }
    },

    /**
     * 交换位置，把房主放到第一位
     * @param arr
     * @param index1
     * @param index2
     * @returns {*}
     */
    swapArray: function (arr, index1, index2) {
        arr[index1] = arr.splice(index2, 1, arr[index1])[0];
        return arr;
    },

    /**
     * 刷新
     * @param userInfo
     */
    updateRoomView: function (userInfos) {
        var playerList = cc.find('Canvas/stage2/boxRoom/playerList');
        var nodes = playerList.children;
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var label = node.getChildByName('username').getComponent(cc.Label);
            label.string = "--";
        }
        for (var i = 0; i < userInfos.length; i++) {
            var node = nodes[i];
            var label = node.getChildByName('username').getComponent(cc.Label);
            label.string = userInfos[i].userName;
        }
    },

    // 隐藏stage2,展示stage1
    hideRoomView: function () {
        this.getRoomList();
        var stage2 = cc.find('Canvas/stage2');
        stage2.active = false;
        var stage1 = cc.find('Canvas/stage1');
        stage1.active = true;
    },


    startGameBtnHandler: function () {
        if (GameData.isOwner === false) {
            console.warn('你不是房主');
            return;
        }
        if (this.players.length < Config.SYSTEM_ROOM_MIN_PLAYER_COUNT) {
            this.showPrompt('房间人数少于' + Config.SYSTEM_ROOM_MIN_PLAYER_COUNT + '人, 请等候');
            console.warn('房间人数少于' + Config.SYSTEM_ROOM_MIN_PLAYER_COUNT + '人, 请等候');
            return;
        }
        GameData.GameMode = true;
        var result = engine.prototype.sendEventEx(0, JSON.stringify({event: Const.GAME_START_EVENT}));
        if (result !== 0) {
            console.error('sdk sendEventEx "GAME_START_EVENT" error', result);
        }
    },


    /**
     *
     */
    shouldStartGame: function () {
        this.showPromptOfError("正在加载 请稍等", true);
        cc.director.loadScene('game', function () {
            this && this.hidePromptOfError && this.hidePromptOfError();
        });

    },

    // 踢人
    kickPlayerBtnHanlder: function (e, i) {
        var nodes = cc.find('Canvas/stage2/boxRoom/playerList').children;
        var userName = nodes[parseInt(i)].getChildByName('username').getComponent(cc.Label).string;
        if (userName === '--') {
            this.showPrompt("该位置没有玩家，冷静一下");
            return;
        }
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].userName === userName) {
                var userID = this.players[i].userID;
                engine.prototype.kickPlayer(userID, "你被踢出去了");
                break;
            }
        }
    },
    removeEvent: function () {
        this.node.off(msg.MATCHVS_LOGOUT, this.onEvent, this);
        this.node.off(msg.MATCHVS_ROOM_DETAIL, this.onEvent, this);
        this.node.off(msg.MATCHVS_ROOM_LIST, this.onEvent, this);
        this.node.off(msg.MATCHVS_JOIN_ROOM_RSP, this.onEvent, this);
        this.node.off(msg.MATCHVS_JOIN_ROOM_NOTIFY, this.onEvent, this);
        this.node.off(msg.MATCHVS_CREATE_ROOM, this.onEvent, this);
        this.node.off(msg.MATCHVS_LEAVE_ROOM, this.onEvent, this);
        this.node.off(msg.MATCHVS_LEAVE_ROOM_NOTIFY, this.onEvent, this);
        this.node.off(msg.MATCHVS_KICK_PLAYER, this.onEvent, this);
        this.node.off(msg.MATCHVS_KICK_PLAYER_NOTIFY, this.onEvent, this);
        this.node.off(msg.MATCHVS_SEND_EVENT_NOTIFY, this.onEvent, this);
        this.node.off(msg.MATCHVS_SEND_EVENT_RSP, this.onEvent, this);
        this.node.off(msg.MATCHVS_NETWORK_STATE_NOTIFY, this.onEvent, this);
        this.node.off(msg.MATCHVS_GAME_SERVER_NOTIFY, this.onEvent, this);
        cc.systemEvent.off(msg.ADD_DESIGNATED_ROOMS, this.onEvent, this);

    },

    onDestroy: function () {
        this.removeEvent();
        clearInterval(this.getRoomListTimer)
        console.log("页面销毁");
    },

});
