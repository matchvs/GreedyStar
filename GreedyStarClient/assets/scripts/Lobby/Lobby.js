let Mvs = require('../Lib/Mvs');
let Const = require('../Const/Const');
let Config = require('../Global/Config');
let GameData = require('../Global/GameData');
let msg = require("../Lib/MatvhvsMessage");
let engine = require("../Lib/MatchvsEngine");
let response = require("../Lib/MatchvsDemoResponse");


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
        isAddDesignatedRooms:false,
        getRoomListTimer:undefined,
        players: [],
        ownereID:0,
    },


    onLoad() {
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
        cc.systemEvent.on(msg.ADD_DESIGNATED_ROOMS,this.onEvent,this);
        //todo 新增
        this.node.on(msg.MATCHVS_GAME_SERVER_NOTIFY, this.onEvent, this);
    },

    /**
     * 判断自己是否是房主
     * @param ownerID
     */
    isOwner(ownerID) {
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
    onEvent(event) {
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
                let label = cc.find('Canvas/stage2/boxRoom/title').getComponent(cc.Label);
                this.ownerID = eventData.userInfoList.owner;
                label.string = '房间ID: ' + eventData.userInfoList.roomID;
                for(var i = 0; i < eventData.userInfoList.length;i++) {
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
                break;
            case msg.MATCHVS_CREATE_ROOM:
                let label1 = cc.find('Canvas/stage2/boxRoom/title').getComponent(cc.Label);
                label1.string = '房间ID: ' + eventData.rsp.roomID;
                this.ownerID = eventData.rsp.owner
                this.players.push({
                    userID: Const.userID,
                    userName: Const.userName,
                });
                this.showRoomView();
                this.roomUserListChangeNotify(this.players,this.ownerID);
                break;
            case msg.MATCHVS_LEAVE_ROOM:
                if (eventData.leaveRoomRsp.status !== 200) {
                    this.showPromptOfError('离开房间失败', true);
                } else {
                    this.players.length = 0;
                    this.hideRoomView();
                    let roomListNode = cc.find('Canvas/stage1/scrollview/view/roomList');
                    roomListNode.removeAllChildren(true);
                }
                break;
            case msg.MATCHVS_LEAVE_ROOM_NOTIFY:
                this.ownerID = eventData.leaveRoomInfo.owner;
                for(var i = 0; i < this.players.length;i++) {
                    if (this.players[i].userID === eventData.leaveRoomInfo.userID) {
                        this.players.splice(i,1);
                    }
                }
                this.roomUserListChangeNotify(this.players, this.ownerID);
                break;
            case msg.MATCHVS_KICK_PLAYER:
                if (eventData.kickPlayerRsp.status === 200) {
                    this.ownerID = eventData.kickPlayerRsp.owner;
                    for(var i = 0; i < this.players.length;i++) {
                        if (this.players[i].userID === eventData.kickPlayerRsp.userID) {
                            this.players.splice(i,1);
                        }
                    }
                    this.roomUserListChangeNotify(this.players,this.ownerID);
                }
                break;
            case msg.MATCHVS_KICK_PLAYER_NOTIFY:
                if (Const.userID === eventData.kickPlayerNotify.userID) {
                    this.players.length = 0;
                    this.hideRoomView();
                    break;
                }
                this.ownerID = eventData.KickPlayerNotify.owner;
                for(var i = 0; i < this.players.length;i++) {
                    if (this.players[i].userID === eventData.kickPlayerNotify.userID) {
                        this.players.splice(i,1);
                    }
                }
                this.roomUserListChangeNotify(this.players,this.ownerID);
                break;
            case msg.MATCHVS_SEND_EVENT_NOTIFY:
                if (JSON.parse(eventData.eventInfo.cpProto).event === Const.GAME_START_EVENT) {
                    this.shouldStartGame();
                }
                break;
            case msg.ADD_DESIGNATED_ROOMS:
                let userProfile = Const.userName;
                GameData.GameMode = true;
                let result = engine.prototype.joinRoom(event.roomID, userProfile);
                if (result !== 0) {
                    this.showPromptOfError('加入房间[sdk]失败 请刷新 重试', true);
                }
                break
        }
    },


    /**
     * 创建房间按钮点击事件
     */
    createRoomBtnHandler() {
        this.isshowUserProfileLayer(false);
        let create = new MsCreateRoomInfo('', 6, 0, 0, 1, '');
        let userProfile = Const.userName;
        let result = engine.prototype.createRoom(create, userProfile);
        if (result !== 0) {
            this.showPromptOfError('创建房间[sdk]失败 请刷新 重试', true);
        }
    },

    /**
     * 加入按钮 点击事件
     */
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
        }
    },

    /**
     * 非房间页面退出点击事件
     */
    mvsLogoutBtn() {
        let result = engine.prototype.logout();
        if (result !== 0) {
            console.error('sdk logout error', result);
            this.showPromptOfError('注销[sdk]失败 请刷新 重试', true);
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

    /**
     * 首页展示房间列表
     * @param roomInfo
     */
    updateRoomItem(roomInfo) {
        let roomListNode;
        try {
            roomListNode = cc.find('Canvas/stage1/scrollview/view/roomList');
            roomListNode.removeAllChildren(true);
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
                    this.isshowUserProfileLayer(true);
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
                this.isshowUserProfileLayer(true);
                this.hideJoinRoomLayer();
            })
        }
    },

    // 是否展示用户详细
    isshowUserProfileLayer(isShow) {
        let layerProfile = cc.find('Canvas/stage1/layerProfile');
        layerProfile.active = isShow;
    },


    // 返回按钮,隐藏用户信息
    closeUserProfileLayer() {
        this.isshowUserProfileLayer(false);
    },

    // 获取房间列表
    getRoomList() {
        if (this.getRoomListTimer === undefined) {
            this.getRoomListTimer = setInterval(() => {
                let filter = new MsRoomFilterEx(6, 0, 0, null,0,1,2);
                engine.prototype.getRoomListEx(filter);
            }, 5000);
        }
    },


    /**
     * 随机加入,快速加入
     */
    quickJoinBtnHandler() {
        GameData.GameMode = false;
        this.isshowUserProfileLayer(false);
        let maxPlayer = 6;
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
        this.isshowUserProfileLayer(false);
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



    // 展示stage2,隐藏stage1
    showRoomView() {
        clearInterval(this.getRoomListTimer);
        this.getRoomListTimer = undefined;
        let stage1 = cc.find('Canvas/stage1');
        stage1.active = false;
        let stage2 = cc.find('Canvas/stage2');
        stage2.active = true;
    },

    /**
     * 房间内玩家数组变化排序
     * @param userInfos
     * @param owner
     */
    roomUserListChangeNotify(userInfos,owner) {
        this.isOwner(owner);
        userInfos.sort(this.sortNumber);
        for(var i = 0; i < userInfos.length;i++) {
            if (owner === userInfos[i].userID) {
               this.swapArray(userInfos,i,0);
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
    sortNumber(obj1,obj2) {
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
    swapArray(arr, index1, index2) {
        arr[index1] = arr.splice(index2, 1, arr[index1])[0];
        return arr;
    },

    /**
     * 刷新
     * @param userInfo
     */
    updateRoomView(userInfos) {
        let playerList = cc.find('Canvas/stage2/boxRoom/playerList');
        let nodes = playerList.children;
        for(var i = 0; i < nodes.length;i++) {
            let node = nodes[i];
            let label = node.getChildByName('username').getComponent(cc.Label);
            label.string = "--";
        }
        for (let i = 0; i < userInfos.length; i++) {
            let node = nodes[i];
            let label = node.getChildByName('username').getComponent(cc.Label);
            label.string = userInfos[i].userName;
        }
    },

    // 隐藏stage2,展示stage1
    hideRoomView() {
        this.getRoomList();
        let stage2 = cc.find('Canvas/stage2');
        stage2.active = false;
        let stage1 = cc.find('Canvas/stage1');
        stage1.active = true;
    },


    startGameBtnHandler() {
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
            engine.prototype.joinOver();
        }
        cc.director.loadScene('game', () => {
            this && this.hidePromptOfError && this.hidePromptOfError();
        });

    },

    // 踢人
    kickPlayerBtnHanlder(e, i) {
        let nodes = cc.find('Canvas/stage2/boxRoom/playerList').children;
        let userName = nodes[parseInt(i)].getChildByName('username').getComponent(cc.Label).string;
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
    removeEvent() {
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
        cc.systemEvent.off(msg.ADD_DESIGNATED_ROOMS,this.onEvent,this);

    },

    onDestroy() {
        this.removeEvent();
        clearInterval(this.getRoomListTimer)
        console.log("页面销毁");
    },

});
