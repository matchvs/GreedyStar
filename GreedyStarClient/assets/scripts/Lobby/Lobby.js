let Mvs = require('../Lib/Mvs');
let Const = require('../Const/Const');
let Config = require('../Global/Config');
let GameData = require('../Global/GameData');
var msg = require("../Lib/MatvhvsMessage");
var engine = require("../Lib/MatchvsEngine");
var response = require("../Lib/MatchvsDemoResponse");


cc.Class({
    extends: cc.Component,

    properties: {
        getRoomDetailTimer: null, // 获取房间详情定时器，在固定时间中发现房间中没有其他玩家加入，就加入机器人一起游戏
        promptSetTimeout: null,
        promptAction: null,
        timer: null,
        isLobbyHide: false,
        userNameNode: cc.Label,
        goldNode: cc.Label,
        userIDNode: cc.Label,
        userNameNode2: cc.Label,
        allValueNode: cc.Label,
        winValueNode: cc.Label,
        isAddDesignatedRooms:false,
    },


    onLoad() {
        cc.director.setDisplayStats(false);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        //Matchvs事件监听
        this.mvsBind(this);
        this.node.removeChild();
        // 展示头像
        this.loadAvatarImage(Const.avatarUrl);
        this.initProfileData();
        this.initPlayersData();
    },

    onKeyDown: function (event) {
        console.warn('keyCode', event.keyCode);
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


    mvsBind(self) {
        response.prototype.init(self);
        this.node.on(msg.MATCHVS_LOGOUT, this.onEvent, this);
        this.node.on(msg.MATCHVS_ROOM_DETAIL, this.onEvent, this);
        this.node.on(msg.MATCHVS_ROOM_LIST_EX, this.onEvent, this);
        this.node.on(msg.MATCHVS_JOIN_ROOM_RSP, this.onEvent ,this);
        this.node.on(msg.MATCHVS_JOIN_ROOM_NOTIFY, this.onEvent, this);
        this.node.on(msg.MATCHVS_CREATE_ROOM, this.onEvent, this);
        this.node.on(msg.MATCHVS_LEAVE_ROOM, this.onEvent, this);
        this.node.on(msg.MATCHVS_LEAVE_ROOM_NOTIFY, this.onEvent, this);
        this.node.on(msg.MATCHVS_KICK_PLAYER, this.onEvent, this);
        this.node.on(msg.MATCHVS_KICK_PLAYER_NOTIFY, this.onEvent, this);
        this.node.on(msg.MATCHVS_SEND_EVENT_NOTIFY, this.onEvent, this);
        this.node.on(msg.MATCHVS_SEND_EVENT_RSP, this.onEvent, this);
        this.node.on(msg.MATCHVS_NETWORK_STATE_NOTIFY, this.onEvent, this);

        //todo 新增
        this.node.on(msg.MATCHVS_GAME_SERVER_NOTIFY, this.onEvent, this);
    },

    isOwner(ownerID) {
        this.showRoomView();
        // 判断自己是不是房主
        if (ownerID === Const.userID) {
            GameData.isOwner = true;
            this.showSomeRoomViewBtn();
        } else {
            GameData.isOwner = false;
            this.hideSomeRoomViewBtn();
        }
    },

    onEvent(event) {
        var eventData = event.detail;
        if (eventData == undefined) {
            eventData = event;
        }
        switch (event.type) {
            case msg.MATCHVS_LOGOUT:
                this.mvsLogoutResponse(eventData.status);
                break;
            case msg.MATCHVS_ROOM_DETAIL:
                break;
            case msg.MATCHVS_NETWORK_STATE_NOTIFY:
                this.mvsNetworkStateNotify(eventData.netNotify);
                break;
            case msg.MATCHVS_ROOM_LIST_EX:
                if (eventData.rsp.status === 200) {
                    this.updateRoomItem(eventData.rsp.roomAttrs);
                } else {
                    console.log('获取房间列表失败 请刷新 重试');
                }
                break;
            case msg.MATCHVS_JOIN_ROOM_NOTIFY:
                this.mvsJoinRoom(eventData.roomUserInfo);
                break;
            case msg.MATCHVS_JOIN_ROOM_RSP:
                if (this.isAddDesignatedRooms) {
                    GameData.ownerID = eventData.userInfoList.ownerID;
                    GameData.roomID = eventData.userInfoList.roomID;
                    let label = cc.find('Canvas/stage2/boxRoom/title').getComponent(cc.Label);
                    label.string = '房间ID: ' + GameData.roomID;
                    for (var i = 0; i < eventData.userInfoList.length; i++) {
                        if (eventData.userInfoList[i] !== Const.userID) {
                            this.mvsJoinRoom(eventData.userInfoList[i], GameData.roomID);
                            GameData.players.push({
                                userID: eventData.userInfoList[i].userID,
                                userName: eventData.userInfoList[i].userName,
                                score: 0,
                                isRobot: false
                            });
                        }
                    }
                    this.isOwner(GameData.ownerID);
                    this.updateRoomView(GameData.players[0]);
                }

                break;
            case msg.MATCHVS_CREATE_ROOM:
                GameData.ownerID = eventData.rsp.owner;
                GameData.roomID = eventData.rsp.roomID;
                let label1 = cc.find('Canvas/stage2/boxRoom/title').getComponent(cc.Label);
                label1.string = '房间ID: ' + GameData.roomID;
                for (var i = 0; i < eventData.rsp.length; i++) {
                    if (eventData.rsp[i] !== Const.userID) {
                        this.mvsJoinRoom(eventData.rsp[i], GameData.roomID);
                    }
                }
                this.isOwner(GameData.ownerID);
                this.updateRoomView(GameData.players[0]);
                break;
            case msg.MATCHVS_LEAVE_ROOM:
                if (eventData.leaveRoomRsp.status !== 200) {
                    this.showPromptOfError('离开房间失败', true);
                } else {
                    this.isAddDesignatedRooms = false;
                    this.mvsLeaveRoom(eventData.leaveRoomRsp)
                }
                break;
            case msg.MATCHVS_LEAVE_ROOM_NOTIFY:
                this.mvsLeaveRoom(eventData.leaveRoomInfo)
                break;
            case msg.MATCHVS_KICK_PLAYER:
                this.mvsLeaveRoom(eventData.kickPlayerRsp);
                break;
            case msg.MATCHVS_KICK_PLAYER_NOTIFY:
                this.mvsLeaveRoom(eventData.kickPlayerNotify);
                break;
            case msg.MATCHVS_SEND_EVENT_NOTIFY:
                if (JSON.parse(eventData.eventInfo.cpProto).event === Const.GAME_START_EVENT) {
                    this.shouldStartGame();
                }
                break;
        }
    },


    /**
     * 创建房间
     */
    createRoomBtnHandler() {
        this.hideUserProfileLayer();
        let create = new MsCreateRoomInfo('roomName', 6, 0, 0, 0, 'roomProperty');
        let userProfile = Const.userName;
        let result = engine.prototype.createRoom(create, userProfile);
        if (result !== 0) {
            this.showPromptOfError('创建房间[sdk]失败 请刷新 重试', true);
        }
    },

    // 加入按钮被点击
    joinRoomBtn2Hanlder() {
        let editBox = cc.find('Canvas/stage1/layerJoin/editbox');
        let editBoxString = editBox.getComponent(cc.EditBox).string;
        let roomID = editBoxString;
        let patt = /[^0-9]/;
        if (patt.test(roomID) || roomID === "") {
            this.showPrompt('请输入正确的房间号');
            return;
        }
        let userProfile = Const.userName;
        let result = engine.prototype.joinRoom(roomID, userProfile);
        if (result !== 0) {
            this.showPromptOfError('加入房间[sdk]失败 请刷新 重试', true);
        } else {
            this.isAddDesignatedRooms = true;
        }
    },


    /**
     * 回调
     */
    mvsJoinRoom(userInfo) {
        this.getRoomDetailTimer = setTimeout(function () {
            engine.prototype.getRoomDetail(GameData.roomID);
        }, GameData.isRoomNumTime);
        this.updateRoomView(userInfo);
    },


    mvsLogout() {
        let result = engine.prototype.logout();
        if (result !== 0) {
            console.error('sdk logout error', result);
            this.showPromptOfError('注销[sdk]失败 请刷新 重试', true);
        }
    },

    mvsLogoutResponse(status) {
        if (status !== 200) {
            this.showPromptOfError('注销失败 请重试', true);
        } else {
            this.showPromptOfError("", false);
            cc.director.loadScene('cover');
        }
    },

    mvsNetworkStateNotify(notifyData) {
        let userID = notifyData.userID;
        if (notifyData.state === 1) {
            if (GameData.isOwner) {
                this.showPrompt('有玩家掉线 自动踢掉');
                let result = engine.prototype.kickPlayer(userID, "")
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

    updateRoomItem(roomInfo) {
        let roomListNode;
        try {
            roomListNode = cc.find('Canvas/stage1/scrollview/view/roomList');
            roomListNode.removeAllChildren();
        } catch (error) {
            console.error('roomList node removeAllChildren error', error);
            return;
        }
        cc.loader.loadRes("prefab/roomItem", (err, res) => {
            if (err) {
                console.error('load prefab/roomItem error', err);
                return;
            }
            for (let i = 0, l = roomInfo.length; i < l; i++) {
                let roomId = roomInfo[i].roomID;
                let roomItemNode = cc.instantiate(res);
                roomItemNode.roomId = roomId;
                roomItemNode.y = -94 * i;
                roomItemNode.parent = roomListNode;
            }
        })
    },


    showPrompt(str) {
        let promptNode = cc.find('Canvas/prompt');
        let promptTxt = promptNode.getChildByName('label').getComponent(cc.Label);
        promptTxt.string = str;
        if (this.promptSetTimeout !== null) {
            clearTimeout(this.promptSetTimeout);
        }
        if (this.promptAction !== null) {
            promptNode.stopAction(this.promptAction);
        }
        promptNode.active = true;
        promptNode.opacity = 255;
        this.promptSetTimeout = setTimeout(() => {
            if (GameData.isGameStart === false) {
                this.promptAction = cc.fadeOut(5.0);
                promptNode.runAction(this.promptAction);
                promptNode.active = false;
            }
        }, 1000);
    },

    mvsErrorResponse(code, errMsg) {
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

    showPromptOfError(str, isShow) {
        let promptNode = cc.find('Canvas/prompt');
        if (isShow) {
            let promptTxt = promptNode.getChildByName('label').getComponent(cc.Label);
            promptTxt.string = str;
            promptNode.active = true;
        } else {
            promptNode.active = false;
        }
    },


    initProfileData() {
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
    loadAvatarImage(avatarUrl) {
        let avatarNode = cc.find('Canvas/profile/avator');
        let sprite = avatarNode.getComponent(cc.Sprite);
        if (typeof(wx) !== "undefined") {
            let image = wx.createImage();
            image.onload = () => {
                try {
                    let texture = new cc.Texture2D();
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


    // 用户头像被点击
    avatarImageClickHandler() {
        let avatarUrl = Const.avatarUrl;
        let avatarNode = cc.find('Canvas/stage1/layerProfile/avator');
        let sprite = avatarNode.getComponent(cc.Sprite);
        // 微信image
        try {
            let image = wx.createImage();
            image.onload = () => {
                try {
                    let texture = new cc.Texture2D();
                    texture.initWithElement(image);
                    texture.handleLoadedTexture();
                    sprite.spriteFrame = new cc.SpriteFrame(texture);
                } catch (e) {
                    console.log('wx onload image error');
                } finally {
                    this.showUserProfileLayer();
                    this.hideJoinRoomLayer();
                }
            }
            image.src = avatarUrl;
        } catch (e) {
            console.log('not wx runtime');
            cc.loader.load(avatarUrl, (err, res) => {
                if (err) {
                    console.error('avatar image click, load avatar image error', err);
                    return;
                }
                // let png = avatarNode.getComponent(cc.Sprite);
                sprite.spriteFrame = new cc.SpriteFrame(res);
                this.showUserProfileLayer();
                this.hideJoinRoomLayer();
            })
        }
    },

    // 展示用户详细
    showUserProfileLayer() {
        let layerProfile = cc.find('Canvas/stage1/layerProfile');
        layerProfile.active = true;
        GameData.isShowUserProfileLayer = true;
    },

    // 隐藏用户详细
    hideUserProfileLayer() {
        let layerProfile = cc.find('Canvas/stage1/layerProfile');
        layerProfile.active = false;
        GameData.isShowUserProfileLayer = false;
    },

    // 返回按钮,隐藏用户信息
    closeUserProfileLayer() {
        this.hideUserProfileLayer();
    },

    // 获取房间列表
    getRoomList() {
        let filter = new MsRoomFilter(0, 0, 0, null);
        engine.prototype.getRoomListEx(filter);
    },


    initPlayersData() {
        if (GameData.players.length !== 0) {
            GameData.players = [];
        }
        GameData.players[0] = {};
        GameData.players[0].userID = Const.userID;
        GameData.players[0].userName = Const.userName;
        GameData.players[0].score = 0;
    },

    /**
     * 随机加入,快速加入
     */
    quickJoinBtnHandler() {
        this.hideUserProfileLayer();
        let maxPlayer = Config.MAX_PLAYER_COUNT;
        let userProfile = Const.userName;
        let result = engine.prototype.joinRandomRoom(maxPlayer, userProfile);
        if (result !== 0) {
            this.showPromptOfError("随机加入房间[sdk]失败 请刷新 重试", true);
        } else {
            this.shouldStartGame();
        }
    },

    /**
     * 加入房间
     */
    joinRoomBtn1Hanlder() {
        this.hideUserProfileLayer();
        this.showJoinRoomLayer(true);
    },

    closeJoinRoomLayer() {
        this.showJoinRoomLayer(false);
    },

    showJoinRoomLayer(isShow) {
        let joinRoomLayer = cc.find('Canvas/stage1/layerJoin');
        joinRoomLayer.active = isShow;
    },


    leaveRoomBtnHandler() {
        let countdownTxt = cc.find('Canvas/stage2/boxRoom/txtCountdown/countdown').getComponent(cc.Label);
        countdownTxt.string = '';
        let txt = cc.find('Canvas/stage2/boxRoom/txtCountdown/txt').getComponent(cc.Label);
        txt.string = '等待开始游戏(至少3人)';
        let result = engine.prototype.leaveRoom("");
        clearInterval(this.getRoomDetailTimer);
        if (result !== 0) {
            this.showPromptOfError('离开房间[sdk]失败 请刷新 重试', true);
        }
    },

    mvsLeaveRoom(rsp) {
        if (rsp.userID === Const.userID) {
            this.clearRoomList();
            this.hideRoomView();
        } else {
            const playerList = cc.find('Canvas/stage2/boxRoom/playerList');
            var nodes = playerList.children;
            for (var i = 0; i < GameData.players.length; i++) {
                if (rsp.userID === GameData.players[i].userID) {
                    for (let j = 0; j < nodes.length; j++) {
                        let node = nodes[j];
                        let label = node.getChildByName('username').getComponent(cc.Label);
                        if (label.string === GameData.players[i].userName) {
                            label.string = "--";
                            GameData.players.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        }
        //如果自己是新的房主,就把自己的名字放到第一栏子里 自己为房主
        if (rsp.owner === Const.userID) {
            for (let j = 0; j < nodes.length; j++) {
                let node = nodes[j];
                let label = node.getChildByName('username').getComponent(cc.Label);
                if (label.string === Const.userName) {
                    label.string = "--";
                    nodes[0].getChildByName('username').getComponent(cc.Label).string = Const.userName;
                }
            }
            this.isOwner(rsp.owner);
        }
    },


    showSomeRoomViewBtn() {
        let startBtn = cc.find('Canvas/stage2/boxRoom/btnStartGame');
        startBtn.active = true;
        let nodes = cc.find('Canvas/stage2/boxRoom/playerList').children;
        for (let i = 1, l = nodes.length; i < l; i++) {
            let node = nodes[i];
            let kickBtn = node.getChildByName('btn');
            kickBtn.active = true;
        }
    },

    hideSomeRoomViewBtn() {
        let startBtn = cc.find('Canvas/stage2/boxRoom/btnStartGame');
        startBtn.active = false;
        let nodes = cc.find('Canvas/stage2/boxRoom/playerList').children;
        for (let i = 1, l = nodes.length; i < l; i++) {
            let node = nodes[i];
            let kickBtn = node.getChildByName('btn');
            kickBtn.active = false;
        }
    },


    /**
     * 获取房间详情的回调接口
     * @param rsp
     */
    mvsGetRoomDetailResponse(rsp) {
        if (rsp.status === 200) {
            if (rsp.userInfos.length <= 1) {
                //关闭房间
                Mvs.engine.joinOver("Matchvs");
                var robotUserNames = ['小蜻蜓', '小蜜蜂'];
                for (var i = 0; i < GameData.robotIDs.length; i++) {
                    GameData.players.push({
                        userId: GameData.robotIDs[i],
                        userName: robotUserNames[i],
                        score: 0,
                        isRobot: true
                    });
                }
                this.shouldStartGame();
            }
        } else {
            console.error('获取房间详情失败');
        }
    },


    // 展示stage2,隐藏stage1
    showRoomView() {
        let stage1 = cc.find('Canvas/stage1');
        stage1.active = false;
        let stage2 = cc.find('Canvas/stage2');
        stage2.active = true;
    },

    /**
     * 刷新
     * @param userInfo
     * @param i
     */
    updateRoomView(userInfo) {
        let playerList = cc.find('Canvas/stage2/boxRoom/playerList');
        let nodes = playerList.children;
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            let label = node.getChildByName('username').getComponent(cc.Label);
            if (label.string === "--") {
                if (userInfo.userName === undefined) {
                    userInfo.userName = JSON.parse(userInfo.userProfile).profile;
                }
                label.string = userInfo.userName;
                break;
            }
        }
        for (let i = 0; i < GameData.players.length; i++) {
            if (GameData.players[i].userID === userInfo.userID) {
                break;
            }
            GameData.players.push({userID: userInfo.userID, userName: userInfo.userName,
                score: 0, isRobot: false });
        }
    },

    // 隐藏stage2,展示stage1
    hideRoomView() {
        let stage2 = cc.find('Canvas/stage2');
        stage2.active = false;
        let stage1 = cc.find('Canvas/stage1');
        stage1.active = true;
    },

    // 清除房间列表和房间Id
    clearRoomList() {
        let label = cc.find('Canvas/stage2/boxRoom/title').getComponent(cc.Label);
        label.string = '';
        let playerList = cc.find('Canvas/stage2/boxRoom/playerList');
        for (let i = 0, l = playerList.children.length; i < l; i++) {
            let node = playerList.children[i];
            let userNameNode = node.getChildByName('username').getComponent(cc.Label);
            userNameNode.string = '--';
        }
    },

    startGameBtnHandler() {

        if (GameData.isOwner === false) {
            console.warn('你不是房主');
            return;
        }
        if (GameData.players.length < Config.CUSTOM_ROOM_MIN_PLAYER_COUNT) {
            this.showPrompt('房间人数少于' + Config.CUSTOM_ROOM_MIN_PLAYER_COUNT + '人, 请等候');
            console.warn('房间人数少于' + Config.CUSTOM_ROOM_MIN_PLAYER_COUNT + '人, 请等候');
            return;
        }
        let result = engine.prototype.sendEventEx(0,JSON.stringify({event: Const.GAME_START_EVENT}));
        if (result !== 0) {
            console.error('sdk sendEventEx "GAME_START_EVENT" error', result);
        }
    },


    /**
     *
     */
    shouldStartGame() {
        this.showPromptOfError("正在加载 请稍等", true);
        if (GameData.isOwner) {
            engine.prototype.sendEventEx(1,JSON.stringify({type: "startGame"}))
        }
        cc.director.loadScene('game', () => {
            this && this.hidePromptOfError && this.hidePromptOfError();
        });

    },

    // 踢人
    kickPlayerBtnHanlder(e, i) {
        let nodes = cc.find('Canvas/stage2/boxRoom/playerList').children;
        let userName = nodes[i].getChildByName('username').getComponent(cc.Label).string;
        if (userName === '--') {
            this.showPrompt("该位置没有玩家，冷静一下");
            return;
        }
        for (var i = 0; i < GameData.players.length; i++) {
            if (GameData.players[i].userName === userName) {
                var userID = GameData.players[i].userID;
                engine.prototype.kickPlayer(userID, "你被踢出去了");
                break;
            }
        }
    },
    removeEvent() {
        this.node.off(msg.MATCHVS_LOGOUT, this.onEvent, this);
        this.node.off(msg.MATCHVS_ROOM_DETAIL, this.onEvent, this);
        this.node.off(msg.MATCHVS_ROOM_LIST_EX, this.onEvent, this);
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
    },

    onDestroy() {
        this.removeEvent();
        console.log("页面销毁");
    },

});
