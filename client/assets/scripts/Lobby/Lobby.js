let Mvs = require('../Lib/Mvs');
let Const = require('../Const/Const');
let Config = require('../Global/Config');
let GameData = require('../Global/GameData');
// let Config = require('Config');
// let GameData = require('GameData');
let wxshare = require('../Util/wxshare');

cc.Class({
    extends: cc.Component,

    onLoad() {
        cc.director.setDisplayStats(false);

        // TODO: 全用cocos的方法
        this.promptSetTimeout = null;
        this.promptAction = null;
        this.timer = null;

        this.isLobbyHide = false

        try {
            wx.onHide(this.onHideHandler.bind(this))
        } catch (e) {
            cc.game.on(cc.game.EVENT_HIDE, this.onHideHandler.bind(this));
        }
    },

    onHideHandler() {
        if (this.isLobbyHide) {
            return;
        }
        console.error('lobby hide')
        this.isLobbyHide = true;
        // TODO: 后期修改该名字
        GameData.isServerErrorCode1000 = true;
        this.showPromptOfError('目前不支持切入后台 请刷新 重开');
    },

    start() {
        this.mvsBind();

        if (Const.userId && GameData.logoutStatus === 6) {
            // this.loadAvatarImage();
            this.login();
            // this.initProfileData();
        } else if (Const.userId && GameData.logoutStatus === 1) {
            this.loadAvatarImage();
            this.initProfileData();

            this.initPlayersData()
        }
        else {
            this.registerUser();
        }

        let timer = setInterval(() => {
            if (GameData.isServerErrorCode1000) {
                clearInterval(timer);
                return;
            }

            if (GameData.loginStatus !== 6) {
                return;
            }

            if (GameData.isInCoverView === true) {
                clearInterval(timer);
                return;
            }

            if (GameData.isGameStart === true) {
                clearInterval(timer);
                return;
            }

            if (GameData.isInRoomView === true) {
                return;
            }

            if (Config.isDebug) {
                // console.warn('setInterval 2s getRoomList');
            }

            this.getRoomList();
        }, 2000);
    },

    mvsBind() {
        Mvs.response.registerUserResponse = this.mvsRegisterUserResponse.bind(this);
        Mvs.response.loginResponse = this.mvsLoginResponse.bind(this);
        Mvs.response.logoutResponse = this.mvsLogoutResponse.bind(this);

        Mvs.response.getRoomListResponse = this.mvsGetRoomListResponse.bind(this);

        Mvs.response.joinRoomResponse = this.mvsJoinRoomResponse.bind(this);
        Mvs.response.createRoomResponse = this.mvsCreateRoomResponse.bind(this);
        Mvs.response.leaveRoomResponse = this.mvsLeaveRoomResponse.bind(this);

        Mvs.response.kickPlayerResponse = this.mvsKickPlayerResponse.bind(this);
        Mvs.response.kickPlayerNotify = this.mvsKickPlayerNotify.bind(this);

        // 不在这里绑定,原因查看本文件中的 'kickPlayerResponse' 的绑定函数
        // mvs.response.kickPlayerResponse = this.kickPlayerResponse.bind(this);

        Mvs.response.sendEventResponse = this.mvsSendEventResponse.bind(this);
        Mvs.response.sendEventNotify = this.mvsSendEventNotify.bind(this);

        Mvs.response.errorResponse = this.mvsErrorResponse.bind(this);

        // 只会在房间内收到
        Mvs.response.networkStateNotify = this.mvsNetworkStateNotify.bind(this);

        // gameserver
        Mvs.response.gameServerNotify = this.mvsGameServerNotify.bind(this);
    },

    mvsNetworkStateNotify(notifyData) {
        if (GameData.isServerErrorCode1000) {
            return
        }

        let data = {
            userId: notifyData.userID,
            state: notifyData.state,
            roomId: notifyData.roomID,
            ownerId: notifyData.owner,
        };

        // console.error('mvsNetworkStateNotify', data);

        // 一旦收到别人异常,房主踢人
        // 如果是房主异常,离开房间
        if (data.state === 1) {

            if (GameData.isOwner) {
                // 有玩家掉线 正在重连
                this.showPrompt('有玩家掉线 自动踢掉');

                // 所以直接干掉那个掉线的
                // 房主主动踢人
                let cpProto = '';
                this.mvsKickPlayer(data.userId, cpProto);
            }

            else {
                // 如果房主异常, 其他人就离开房间
                if (data.userId === data.ownerId) {
                    this.showPrompt('房主掉线 自动离开房间');
                    this.leaveRoomBtnHandler();
                } else {
                    this.showPrompt('有玩家掉线 自动踢掉');
                }
            }
            // this.otherExitTheGame(data);
        }
        // 实际上没有做重连成功
        // 所以直接不处理state = 3的情况
        // else if (data.state === 3) {
        // 有玩家掉线 重连失败 已退出游戏
        // this.showPrompt('有玩家掉线 重连失败 已退出游戏');
        // }
    },

    otherExitTheGame(data) {
        let exitUserId = data.userId;
        let ownerId = data.ownerId;

        if (exitUserId === true) {
            let nodes = cc.find('Canvas/stage2/boxRoom/playerList').children;

            let k = 0;
            for (let i = 0, l = GameData.players.length; i < l; i++) {
                if (exitUserId === GameData.players[i].userId) {
                    k = i;
                    break
                }
            }
            GameData.players.splice(k, 1);

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
                if (exitUserId === GameData.players[i].userId) {
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
                        label.string = GameData.players[i].userId;
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
    },

    showPrompt(str) {
        // if (GameData.isGameStart === false && GameData.isGameOver === false) {
        if (GameData.isGameStart === false) {
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

            // WHY: sequence与action不同???
            // if (GameData.isGameStart === false) {
            //     this.promptAction = cc.sequence(
            //         cc.delayTime(1),
            //         cc.fadeOut(5.0)
            //     );
            //     promptNode.runAction(this.promptAction);
            //     promptNode.active = false;
            // }
        }
    },

    mvsErrorResponse(code, errMsg) {
        console.error('mvsErrorResponse', arguments);

        // TODO: sdk必须返回合理的结果,才能正确处理

        GameData.joinRoomStatus = 1;
        this.resetSomeGameData();

        // 目前只能处理code = 1001 的情况
        // ??? code = 1001 && errMsg === "gateway disconnect"
        if (code === 1001) {
            GameData.isServerErrorCode1000 = true;
            this.showPromptOfError('你已掉线 请刷新 重开');
        }
        // 错误码未定,sdk
        else if (code === 404) {
            this.showPrompt("该房间不能加入");
        }
    },

    showPromptOfError(str) {
        let promptNode = cc.find('Canvas/prompt');
        let promptTxt = promptNode.getChildByName('label').getComponent(cc.Label);
        promptTxt.string = str;

        promptNode.active = true;
    },

    initProfileData() {
        let userNameNode = cc.find('Canvas/profile/username').getComponent(cc.Label);
        // userNameNode.string = Const.userId;
        userNameNode.string = Const.userName;

        let goldNode = cc.find('Canvas/profile/disGold/value').getComponent(cc.Label);
        goldNode.string = GameData.gold;

        let userIdNode = cc.find('Canvas/stage1/layerProfile/userid').getComponent(cc.Label);
        userIdNode.string = '昵称: ' + Const.userName;

        let userNameNode2 = cc.find('Canvas/stage1/layerProfile/username').getComponent(cc.Label);
        userNameNode2.string = '用户ID:  ' + Const.userId;

        let allValueNode = cc.find('Canvas/stage1/layerProfile/numGame/num').getComponent(cc.Label);
        allValueNode.string = GameData.allValue;

        let winValueNode = cc.find('Canvas/stage1/layerProfile/numChampion/num').getComponent(cc.Label);
        winValueNode.string = GameData.winValue;
    },

    // 注册
    registerUser() {
        if (GameData.registerStatus === 2 || GameData.registerStatus === 5) {
            console.warn('sdk registering or waiting response');
            console.warn('GameData.registerStatus', GameData.registerStatus);
            return;
        }

        GameData.registerStatus = 2;
        this.mvsRegisterUser();
    },

    mvsRegisterUser() {
        let result = Mvs.engine.registerUser();
        if (result === 0) {
            GameData.registerStatus = 3;
            console.log('sdk registerUser ok', result);
        } else {
            GameData.registerStatus = 4;
            console.error('sdk registerUser error', result);
            return;
        }

        GameData.registerStatus = 5;
    },

    mvsRegisterUserResponse(userInfo) {
        if (userInfo) {
            GameData.registerStatus = 6;
            console.log('response register user ok', userInfo);
        } else {
            GameData.registerStatus = 7;
            console.error('response register user error', userInfo);
            return;
        }

        Const.userId = userInfo.id;
        Const.token = userInfo.token;
        Const.userName = userInfo.name;
        Const.avatarUrl = userInfo.avatar;

        this.loadAvatarImage();
        this.login();
        this.initProfileData();
    },

    // 添加图片avatar
    loadAvatarImage() {
        let avatarUrl = Const.avatarUrl;
        // let avatarUrl = "https://wx.qlogo.cn/mmopen/vi_32/1iaXQDdbeiaLMnpKmMicgvzdjFhf4o6kibdpPo5iagYJMt4m9kA8E0H3h0p4zeRq0CBILU8mKmDhrUygcPUCVdsV3pw/132";

        // let avatarUrl = 'http://tools.itharbors.com/res/logo.png';
        // var avatarUrl = 'http://pic.vszone.cn/upload/avatar/1464079979.png'
        let avatarNode = cc.find('Canvas/profile/avator');
        let sprite = avatarNode.getComponent(cc.Sprite);
        // console.log('loadAvatarImage');

        // cc.loader.load(avatarUrl, function (err, res) {
        //     if (err) {
        //         console.error('load avatar image error', err);
        //         return;
        //     }

        //     let png = avatarNode.getComponent(cc.Sprite);
        //     png.spriteFrame = new cc.SpriteFrame(res);
        // })
        try {
            let image = wx.createImage();
            image.onload = () => {
                try {
                    let texture = new cc.Texture2D();
                    texture.initWithElement(image);
                    texture.handleLoadedTexture();

                    // let sprite = avatarNode.getComponent(cc.Sprite);
                    sprite.spriteFrame = new cc.SpriteFrame(texture);
                } catch (e) {
                    console.log('wx onload image error');
                }
            }
            image.src = avatarUrl;
        } catch (e) {
            cc.loader.load(avatarUrl, function (err, res) {
                if (err) {
                    console.error('load avatar image error', err);
                    return;
                }

                // let png = avatarNode.getComponent(cc.Sprite);
                sprite.spriteFrame = new cc.SpriteFrame(res);
            })
        }
    },

    login() {
        if (GameData.loginStatus === 2 || GameData.loginStatus === 5) {
            console.warn('sdk logining or waiting response');
            console.warn('GameData.loginStatus', GameData.loginStatus);
            return;
        }

        let token = Const.token
            , userId = Const.userId
            , gameId = Const.gameId
            , appKey = Const.appKey
            , deviceId = Const.deviceId
            , gatewayId = Const.gatewayId
            , secretKey = Const.secretKey
            , gameVersion = Const.gameVersion;

        GameData.loginStatus = 2;

        this.mvsLogin(userId, token, gameId, gameVersion, appKey, secretKey, deviceId, gatewayId);
    },

    mvsLogin(userId, token, gameId, gameVersion, appKey, secretKey, deviceId, gatewayId) {
        let result = Mvs.engine.login(userId, token, gameId, gameVersion, appKey, secretKey, deviceId, gatewayId);
        if (result === 0) {
            GameData.loginStatus = 3;
            console.log('sdk login ok', result);
        } else {
            GameData.loginStatus = 4;
            console.error('sdk login error', result);
            return;
        }

        GameData.loginStatus = 5;
    },

    mvsLoginResponse(loginRsp) {
        if (loginRsp.status === 200) {
            GameData.loginStatus = 6;
            console.log('response login  ok', loginRsp);
        } else {
            GameData.loginStatus = 7;
            console.error('response login error', loginRsp);
            return;
        }

        /* try {
           wxshare.getWxUserInfo(function (userinfo) {
               console.log("get wx.userinfo success ", userinfo);
               // userNameTxt.text = userinfo.nickName;
               // self.loadAvatar(userinfo.avatarUrl);
               Const.userName = userinfo.nickName;
               Const.avatarUrl = userinfo.avatarUrl;
           });
       } catch (error) {
           console.log("get wx.userinfo is fail" + error);
       } finally {
           console.log('Const.userName', Const.userName);
           console.log('Const.avatarUrl', Const.avatarUrl);

           this.loadAvatarImage();
           this.initProfileData();

           this.initPlayersData();
           this.getRoomList();
       } */

        // 注意: 这不是try catch的正确用法,try catch不能捕获异步错误
        // 这里使用只是为了判断下可不可以使用wxshare.getWxUserInfo
        try {
            wxshare.getWxUserInfo((userinfo) => {
                console.log("get wx.userinfo success ", userinfo);
                // userNameTxt.text = userinfo.nickName;
                // self.loadAvatar(userinfo.avatarUrl);
                Const.userName = userinfo.nickName;
                Const.avatarUrl = userinfo.avatarUrl;

                this.loadAvatarImage();
                this.initProfileData();

                this.initPlayersData();
                this.getRoomList();
            });
        } catch (error) {
            console.log("get wx.userinfo is fail" + error);

            this.loadAvatarImage();
            this.initProfileData();

            this.initPlayersData();
            this.getRoomList();
        }
    },

    backBtnHandler() {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        if (GameData.loginStatus !== 6) {
            this.showPrompt('登录中 请稍等');
            return;
        }

        if (GameData.logoutStatus === 2 || GameData.logoutStatus === 5) {
            console.warn('sdk logouting or waiting response');
            console.warn('GameData.logoutStatus', GameData.logoutStatus);
            return;
        }

        GameData.logoutStatus = 2;

        let cpProto = '';
        this.mvsLogout(cpProto);
    },

    mvsLogout(cpProto) {
        let result = Mvs.engine.logout(cpProto);

        if (result === 0) {
            GameData.logoutStatus = 3;
            console.log('sdk logout ok', result);
        } else {
            GameData.logoutStatus = 4;
            console.error('sdk logout error', result);
            return;
        }

        GameData.logoutStatus = 5;
    },

    mvsLogoutResponse(status) {
        if (status === 200) {
            GameData.logoutStatus = 6;
            console.log('response logout ok', status);
        } else {
            GameData.logoutStatus = 7;
            console.log('response logout error', status);
            return;
        }
        GameData.isInCoverView = true;
        this.resetSomeGameData();

        try {
            wx.offHide(this.onHideHandler.bind(this))
        } catch(e) {
            cc.game.off(cc.game.EVENT_HIDE);
        }

        cc.director.loadScene('cover');
    },

    // 用户头像被点击
    avatarImageClickHandler() {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        if (GameData.loginStatus !== 6) {
            this.showPrompt('登录中 请稍等');
            return;
        }

        // 在房间场景中,点击无效
        if (GameData.isInRoomView === true) {
            return;
        }

        let avatarUrl = Const.avatarUrl;
        // let avatarUrl = "https://wx.qlogo.cn/mmopen/vi_32/1iaXQDdbeiaLMnpKmMicgvzdjFhf4o6kibdpPo5iagYJMt4m9kA8E0H3h0p4zeRq0CBILU8mKmDhrUygcPUCVdsV3pw/132";

        // let avatarUrl = 'http://tools.itharbors.com/res/logo.png';
        let avatarNode = cc.find('Canvas/stage1/layerProfile/avator');
        let sprite = avatarNode.getComponent(cc.Sprite);
        // cc.loader.load(avatarUrl, (err, res) => {
        //     if (err) {
        //         console.error('avatar image click, load avatar image error', err);
        //         return;
        //     }

        //     let png = avatarNode.getComponent(cc.Sprite);
        //     png.spriteFrame = new cc.SpriteFrame(res);

        //     this.showUserProfileLayer();

        //     this.hideJoinRoomLayer();
        // })

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
        if (GameData.getRoomListStatus === 2 || GameData.getRoomListStatus === 5) {
            console.warn('sdk getRoomListing or warting response');
            console.warn('GameData.getRoomListStatus', GameData.getRoomListStatus);
            return;
        }

        GameData.getRoomListStatus = 2;

        let filter = new MsRoomFilter(0, 0, 0, null);
        this.mvsGetRoomList(filter);
    },

    mvsGetRoomList(filter) {
        let result = Mvs.engine.getRoomList(filter);

        if (result === 0) {
            GameData.getRoomListStatus = 3;
            console.log('sdk getRoomList ok', result);
        } else {
            GameData.getRoomListStatus = 4;
            console.error('sdk getRoomList error', result);
            return;
        }

        GameData.getRoomListStatus = 5;
    },

    mvsGetRoomListResponse(status, roomInfo) {
        if (status === 200) {
            GameData.getRoomListStatus = 6;
            console.log('response getRoomList ok', status);
        } else {
            GameData.getRoomListStatus = 7;
            console.error('response getRoomList error', status);
            return;
        }

        if (GameData.isInCoverView === true) {
            return;
        }

        if (GameData.isInRoomView === true) {
            return;
        }

        this.updateRoomItem(roomInfo);
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

            this.roomItemPrefab = res;

            for (let i = 0, l = roomInfo.length; i < l; i++) {
                let roomId = roomInfo[i].roomID;
                let roomItemNode = cc.instantiate(this.roomItemPrefab);
                roomItemNode.roomId = roomId;

                roomItemNode.y = -94 * i;
                roomItemNode.parent = roomListNode;
            }
        })
    },

    initPlayersData() {
        if (GameData.players.length !== 0) {
            GameData.players = [];
        }

        GameData.players[0] = {};
        GameData.players[0].userId = Const.userId;
        GameData.players[0].userName = Const.userName;
        GameData.players[0].score = 0;
    },

    /**
     * 随机加入,快速加入
     */
    quickJoinBtnHandler() {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        if (GameData.loginStatus !== 6) {
            this.showPrompt('登录中 请稍等');
            return;
        }

        if (GameData.isCreateRoomBtnClick === true) {
            return;
        }

        if (GameData.isJoinRoomBtn2Click === true) {
            return;
        }

        if (GameData.isRoomItemClick === true) {
            return;
        }

        if (GameData.isQuickJoinBtnClick === true) {
            console.warn('quick join btn has be clicked, please wait response');
            return;
        }

        GameData.isQuickJoinBtnClick = true;

        if (GameData.joinRandomRoomStatus === 2 || GameData.joinRandomRoomStatus === 5) {
            console.warn('sdk joinRandomRooming or wait response');
            console.warn('GameData.joinRandomRoomStatus', GameData.joinRandomRoomStatus);
            return;
        }
        this.hideUserProfileLayer();

        GameData.joinRandomRoomStatus = 2;

        let maxPlayer = Config.MAX_PLAYER_COUNT;
        let userProfile = Const.userName;
        this.mvsJoinRandomRoom(maxPlayer, userProfile);
    },

    // 随机加入房间
    mvsJoinRandomRoom(maxPlayer, userProfile) {
        let result = Mvs.engine.joinRandomRoom(maxPlayer, userProfile);

        if (result === 0) {
            GameData.joinRandomRoomStatus = 3;
            console.log('sdk joinRandomRoom ok', result);
        } else {
            GameData.joinRandomRoomStatus = 4;
            console.error('sdk joinRandomRoom error', result);
            return;
        }

        GameData.joinRandomRoomStatus = 5;
    },


    /**
     * 创建房间
     */
    // 创建房间的按钮被点击
    createRoomBtnHandler() {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        if (GameData.loginStatus !== 6) {
            this.showPrompt('登录中 请稍等');
            return;
        }

        if (GameData.isQuickJoinBtnClick === true) {
            return;
        }

        if (GameData.isJoinRoomBtn2Click === true) {
            return;
        }

        if (GameData.isRoomItemClick === true) {
            return;
        }

        if (GameData.isCreateRoomBtnClick === true) {
            console.warn('create room btn has be clicked, please wait response');
            return;
        }

        GameData.isCreateRoomBtnClick = true;

        if (GameData.createRoomStatus === 2 || GameData.createRoomStatus === 5) {
            console.warn('sdk createRoom or wait response');
            console.warn('GameData.createRoomStatus', GameData.createRoomStatus);
            return;
        }
        this.hideUserProfileLayer();

        GameData.createRoomStatus = 2;

        // roomName, maxPlayer, mode, canWatch, visibility, roomProperty
        let create = new MsCreateRoomInfo('roomName', 6, 0, 0, 0, 'roomProperty');
        let userProfile = Const.userName;
        this.mvsCreateRoom(create, userProfile);
    },

    // 创建房间
    mvsCreateRoom(create, userProfile) {
        let result = Mvs.engine.createRoom(create, userProfile);

        if (result === 0) {
            GameData.createRoomStatus = 3;
            console.log('sdk createRoom ok', result);
        } else {
            GameData.createRoomStatus = 4;
            console.warn('sdk createRoom error', result);
            return;
        }

        GameData.createRoomStatus = 5;
    },

    /**
     * 加入房间
     */
    // 加入指定的房间按钮被点击
    joinRoomBtn1Hanlder() {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        if (GameData.loginStatus !== 6) {
            this.showPrompt('登录中 请稍等');
            return;
        }

        if (GameData.isQuickJoinBtnClick === true) {
            return;
        }

        if (GameData.isCreateRoomBtnClick === true) {
            return;
        }

        if (GameData.isRoomItemClick === true) {
            return;
        }

        if (GameData.isJoinRoomBtn1Click === true) {
            return;
        }
        this.hideUserProfileLayer();

        GameData.isJoinRoomBtn1Click = true;
        this.showJoinRoomLayer();
    },

    closeJoinRoomLayer() {
        this.hideJoinRoomLayer();
    },

    showJoinRoomLayer() {
        GameData.isJoinRoomBtn1Click = false;

        let joinRoomLayer = cc.find('Canvas/stage1/layerJoin');
        joinRoomLayer.active = true;

        GameData.isShowJoinRoomLayer = true;
    },

    hideJoinRoomLayer() {
        GameData.isJoinRoomBtn1Click = false;

        let joinRoomLayer = cc.find('Canvas/stage1/layerJoin');
        joinRoomLayer.active = false;

        GameData.isShowJoinRoomLayer = false;
    },

    // 加入按钮被点击
    joinRoomBtn2Hanlder() {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        if (GameData.isQuickJoinBtnClick === true) {
            return;
        }

        if (GameData.isCreateRoomBtnClick === true) {
            return;
        }

        if (GameData.isRoomItemClick === true) {
            return;
        }


        let editBox = cc.find('Canvas/stage1/layerJoin/editbox');
        let editBoxString = editBox.getComponent(cc.EditBox).string;
        let roomId = editBoxString;
        let patt = /[^0-9]/;
        if (patt.test(roomId) || roomId === "") {
            this.showPrompt('请输入正确的房间号');
            return;
        }


        if (GameData.isJoinRoomBtn2Click === true) {
            return;
        }

        GameData.isJoinRoomBtn2Click = true;

        if (GameData.joinRoomStatus === 2 || GameData.joinRoomStatus === 5) {
            console.warn('sdk joinRooming or waiting response');
            console.warn('GameData.joinRoomStatus', GameData.joinRoomStatus);
            return;
        }

        GameData.joinRoomStatus = 2;

        let userProfile = Const.userName;
        this.mvsJoinRoom(roomId, userProfile)
    },


    // 加入房间
    mvsJoinRoom(roomId, userProfile) {
        console.warn('加入房间之前,检测下GameData', GameData);

        let result = Mvs.engine.joinRoom(roomId, userProfile);

        if (result === 0) {
            GameData.joinRoomStatus = 3;
            console.log('sdk joinRoom ok', result);
        } else {
            GameData.joinRoomStatus = 4;
            console.error('sdk joinRoom error', result);
            return;
        }

        GameData.joinRoomStatus = 5;
    },

    leaveRoomBtnHandler() {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        // console.error('GameData.gameStartCountdownValue', GameData.gameStartCountdownValue);
        // console.error('GameData.canLeaveRoom', GameData.canLeaveRoom);

        if (GameData.canLeaveRoom === false) {
            this.showPrompt('游戏正在开始 不能离开房间了');
            console.warn('最后5秒不能离开房间');
            return;
        }

        // 用户在gameserver返回数据
        /**
         * data = {
         *     isServer: true,
         *     time: 5
         * }
         */
        // 的时候, 因数据传输延迟,用户还是可以退出房间
        let countdownTxt = cc.find('Canvas/stage2/boxRoom/txtCountdown/countdown').getComponent(cc.Label);
        countdownTxt.string = '';

        let txt = cc.find('Canvas/stage2/boxRoom/txtCountdown/txt').getComponent(cc.Label);
        txt.string = '等待开始游戏(至少3人)';

        if (GameData.leaveRoomStatus === 2 || GameData.leaveRoomStatus === 5) {
            console.warn('sdk leaveRooming or waiting response');
            console.warn('GameData.leaveRoomStatus', GameData.leaveRoomStatus);
            return;
        }

        GameData.leaveRoomStatus = 2;
        let cpProto = "";
        this.mvsLeaveRoom(cpProto);
    },

    // 离开房间
    mvsLeaveRoom(cpProto) {
        let result = Mvs.engine.leaveRoom(cpProto);

        if (result === 0) {
            GameData.leaveRoomStatus = 3;
            console.log('sdk leaveRoom ok', result);
        } else {
            GameData.leaveRoomStatus = 4;
            console.error('sdk leaveRoom error', result);
            return;
        }

        GameData.leaveRoomStatus = 5;
    },

    mvsLeaveRoomResponse(rsp) {
        if (rsp.status === 200) {
            GameData.leaveRoomStatus = 6;
            console.log('response leaveRoom ok', rsp);
        } else {
            GameData.leaveRoomStatus = 7;
            console.error('response leaveRoom error', rsp);
            return;
        }

        this.resetSomeGameData();
        console.log('自己离开房间之后,检测下GameData', GameData);
        this.consoleGameData();

        this.clearRoomList();
        this.hideRoomView();
    },

    consoleGameData() {
        if (Config.isDebug === true) {
            console.log('=================')
            console.warn('GameData', GameData);
            console.log('=================')
        }
    },


    showSomeRoomViewBtn() {
        // Canvas/stage2/boxRoom/txtCountdown
        let txtCountdown = cc.find('Canvas/stage2/boxRoom/txtCountdown');
        if (GameData.isCreateRoomBtnClick === true || GameData.isJoinRoomBtn2Click === true || GameData.isRoomItemClick === true) {
            txtCountdown.active = false;
        }
        else if (GameData.isQuickJoinBtnClick === true) {
            txtCountdown.active = true;
        }

        // Canvas/stage2/boxRoom/btnStartGame
        let startBtn = cc.find('Canvas/stage2/boxRoom/btnStartGame');
        startBtn.active = true;

        //  Canvas/stage2/boxRoom/playerList/playerItem/btn
        let nodes = cc.find('Canvas/stage2/boxRoom/playerList').children;
        for (let i = 1, l = nodes.length; i < l; i++) {
            let node = nodes[i];
            let kickBtn = node.getChildByName('btn');
            kickBtn.active = true;
        }
    },

    hideSomeRoomViewBtn() {
        let txtCountdown = cc.find('Canvas/stage2/boxRoom/txtCountdown');
        if (GameData.isCreateRoomBtnClick === true || GameData.isJoinRoomBtn2Click === true || GameData.isRoomItemClick === true) {
            txtCountdown.active = false;
        }
        else if (GameData.isQuickJoinBtnClick === true) {
            txtCountdown.active = true;
        }

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
     * 回调
     */
    mvsJoinRoomResponse(status, userInfoList, roomInfo) {
        if (status === 200) {
            if (GameData.isQuickJoinBtnClick === true) {
                GameData.joinRandomRoomStatus = 6;
                console.log('response joinRandomRoom ok', userInfoList, roomInfo);
            }

            else if (GameData.isJoinRoomBtn2Click === true || GameData.isRoomItemClick === true) {
                GameData.joinRoomStatus = 6;
                console.log('response joinRoom ok', userInfoList, roomInfo);
            }
        }

        else {
            if (GameData.isQuickJoinBtnClick === true) {
                GameData.joinRandomRoomStatus = 7;
                console.error('response joinRandomRoom error', userInfoList, roomInfo);
            }

            else if (GameData.isJoinRoomBtn2Click === true || GameData.isRoomItemClick === true) {
                GameData.joinRoomStatus = 7;
                console.error('response joinRoom error', userInfoList, roomInfo);
            }
            return;
        }

        if (GameData.isQuickJoinBtnClick === true) {
            for (let i = 0, l = userInfoList.length; i < l; i++) {
                let userId = userInfoList[i].userId;
                let userProfile = userInfoList[i].userProfile;

                GameData.players[i + 1] = {};
                GameData.players[i + 1].userId = userId;
                GameData.players[i + 1].userName = userProfile;
                GameData.players[i + 1].score = 0
            }

            GameData.ownerId = roomInfo.ownerId;
            GameData.roomId = roomInfo.roomID;
            // GameData.roomProperty = roomInfo.roomProperty

            // 判断自己是不是房主
            if (roomInfo.ownerId === Const.userId) {
                GameData.isOwner = true;
            } else {
                GameData.isOwner = false;
            }

            GameData.isInRoomView = true;

            this.consoleGameData();

            this.updateRoomView();
            this.showRoomView();

            // if (GameData.isGameStart === false) {
            //     // return;
            //     // if (GameData.players.length === Config.SYSTEM_ROOM_MIN_PLAYER_COUNT) {
            //     //     GameData.canLeaveRoom = false;
            //     //     this.shouldStartGame();
            //     // }
            // }

            // 是否需要倒计时开始
        }


        else if (GameData.isCreateRoomBtnClick || GameData.isJoinRoomBtn2Click === true || GameData.isRoomItemClick === true) {
            for (let i = 0, l = userInfoList.length; i < l; i++) {
                let userId = userInfoList[i].userId;
                let userProfile = userInfoList[i].userProfile;

                GameData.players[i + 1] = {};
                GameData.players[i + 1].userId = userId;
                GameData.players[i + 1].userName = userProfile;
                GameData.players[i + 1].score = 0;
            }

            GameData.ownerId = roomInfo.ownerId;
            GameData.roomId = roomInfo.roomID;

            GameData.isOwner = roomInfo.ownerId === Const.userId;

            this.consoleGameData();

            if (GameData.isJoinRoomBtn2Click === true) {
                this.hideJoinRoomLayer();
            }

            GameData.isInRoomView = true;

            this.updateRoomView();
            this.showRoomView();
        }
    },


    // 创建房间回调
    mvsCreateRoomResponse(rsp) {
        if (rsp.status === 200) {
            console.log('response createRoom ok', rsp);
            GameData.createRoomStatus = 6;
        } else {
            console.error('response createRoom error', rsp);
            GameData.createRoomStatus = 7;
            return;
        }

        GameData.roomId = rsp.roomID;
        GameData.ownerId = rsp.owner;
        GameData.isOwner = true;

        this.consoleGameData();

        GameData.isInRoomView = true;

        this.updateRoomView();
        this.showRoomView();
    },

    // 展示stage2,隐藏stage1
    showRoomView() {
        let stage1 = cc.find('Canvas/stage1');
        stage1.active = false;

        let stage2 = cc.find('Canvas/stage2');
        stage2.active = true;
    },

    // 隐藏stage2,展示stage1
    hideRoomView() {
        let stage2 = cc.find('Canvas/stage2');
        stage2.active = false;

        let stage1 = cc.find('Canvas/stage1');
        stage1.active = true;
    },

    updateRoomView() {
        if (GameData.isQuickJoinBtnClick === true) {
            this.hideSomeRoomViewBtn();
        } else {
            if (GameData.isOwner === true) {
                this.showSomeRoomViewBtn();
            } else {
                this.hideSomeRoomViewBtn();
            }
        }

        let label = cc.find('Canvas/stage2/boxRoom/title').getComponent(cc.Label);
        label.string = '房间ID: ' + GameData.roomId + '  ';

        let playerList = cc.find('Canvas/stage2/boxRoom/playerList');
        let nodes = playerList.children;

        if (GameData.isQuickJoinBtnClick === true || GameData.isJoinRoomBtn2Click === true || GameData.isRoomItemClick === true) {
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

            for (let i = 0; i < j; i++) {
                let node = nodes[i];
                let label = node.getChildByName('username').getComponent(cc.Label);
                // label.string = players[i].userId;
                label.string = players[i].userName;
            }
        }

        else if (GameData.isCreateRoomBtnClick === true && GameData.isOwner === true) {
            let node = nodes[0];
            let label = node.getChildByName('username').getComponent(cc.Label);
            // label.string = Const.userId
            label.string = Const.userName
        }
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
        if (GameData.isServerErrorCode1000) {
            return;
        }

        if (GameData.isOwner === false) {
            console.warn('你不是房主');
            return;
        }

        if (GameData.players.length < Config.CUSTOM_ROOM_MIN_PLAYER_COUNT) {
            this.showPrompt('房间人数少于' + Config.CUSTOM_ROOM_MIN_PLAYER_COUNT + '人, 请等候');
            console.warn('房间人数少于' + Config.CUSTOM_ROOM_MIN_PLAYER_COUNT + '人, 请等候');
            return;
        }

        let data = JSON.stringify({
            event: Const.GAME_START_EVENT,
            isClient: true,
        });

        let result = Mvs.engine.sendEventEx(1, data, 0, []);
        if (result.result === 0) {
            console.log('sdk sendEventEx "GAME_START_EVENT" ok', result);
        } else {
            console.error('sdk sendEventEx "GAME_START_EVENT" error', result);
            return;
        }

        this.sendGameStartEvent();
    },

    sendGameStartEvent() {
        let data = JSON.stringify({
            event: Const.GAME_START_EVENT,
            isClient: true,
            isGameStart: false,
        });

        let result = Mvs.engine.sendEvent(data);
        if (result.result === 0) {
            // 用于 sdk sendEventResponse
            GameData.gameStartEventSequence = result.sequence;
            console.log('sdk sendEvent "GAME_START_EVENT" ok', result);
        } else {
            console.error('sdk sendEvent "GAME_START_EVENT" error', result);
        }
    },

    mvsSendEventResponse(rsp) {
        if (GameData.isGameStart === false) {

            if (rsp.status === 200) {
                console.log('response sentEvent ok', rsp);
            } else {
                console.error('response sentEvent error', rsp);
                return;
            }

            if (GameData.gameStartEventSequence === rsp.sequence) {
                this.shouldStartGame();
            }
        }
    },

    mvsSendEventNotify(eventInfo) {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        let cpProto = eventInfo.cpProto;
        let data = JSON.parse(cpProto);
        if (data.isClient === true) {
            if (data.isGameStart === false) {
                if (GameData.isCreateRoomBtnClick === true || GameData.isJoinRoomBtn2Click === true || GameData.isRoomItemClick === true) {
                    if (data.event === Const.GAME_START_EVENT) {
                        this.shouldStartGame();
                    }
                }

                else if (GameData.isQuickJoinBtnClick === true) {
                    if (data.event === Const.GAME_START_EVENT) {
                        this.shouldStartGame();
                    }
                }
            }
            else if (data.isGameStart === true && data.toUserId === Const.userId) {
                if (data.event === Const.USER_IN_THE_ROOM) {
                    GameData.isUserInTheRoom = true;
                    if (!!this.timer) {
                        clearTimeout(this.timer);
                    }
                }

                if (data.event === Const.GAME_START_EVENT_BY_HALF) {
                    // if (GameData.isHasChangeOtherScore === true) {
                    //     return;
                    // }

                    // GameData.isHasChangeOtherScore = true;

                    // let timer = setTimeout(() => {
                    //     cc.director.GlobalEvent.emit('othersBirth', data);
                    //     clearTimeout(timer);
                    // }, 1000);

                    // let playerStatusData = data.data;
                    // let l = GameData.players.length;
                    // let j = playerStatusData.length;

                    // if (l !== j) {
                    //     console.error('GameData.player.length !== playerStatusData.length');
                    //     console.error('GameData.players.length', l);
                    //     console.error('playerStatusData.length', j);

                    //     // 已收到的信息data.data为准
                    //     // 去掉比data.data中多的部分
                    //     // filter
                    //     GameData.players = GameData.players.filter(function (obj) {
                    //         for (let i = 0; i < playerStatusData.length; i++) {
                    //             if (obj.userId === playerStatusData[i].userId) {
                    //                 return true
                    //             }
                    //         }
                    //     })
                    // }

                    // for (let i = 0; i < GameData.players.length; i++) {
                    //     for (let k = 0; k < j; k++) {
                    //         if (GameData.players[i].userId === playerStatusData[k].userId) {
                    //             GameData.players[i].score = playerStatusData[k].score
                    //         }
                    //     }
                    // }

                    GameData.gameTime = data.time;
                    this.shouldStartGame();
                }

                // if (data.event === Const.OTHERS_ADD_FOODS) {
                //     if (GameData.isHasOthersAddFoods === true) {
                //         return;
                //     }

                //     GameData.isHasOthersAddFoods = true;
                //     console.log('GameData.isHasOthersAddFoods',GameData.isHasOthersAddFoods);
                //     let timer2 = setTimeout(() => {
                //         cc.director.GlobalEvent.emit('othersAddFoods', data);
                //         clearTimeout(timer2)
                //     }, 1000);
                // }
            }

        }
    },

    mvsGameServerNotify(eventInfo) {
        if (GameData.isServerErrorCode1000) {
            return
        }

        let cpProto = eventInfo.cpProto;
        let data = JSON.parse(cpProto);


        if (data.isServer === true) {
            // 本地GameData.isGameStart为false,
            // 当启动游戏的时候,会修改为true
            if (GameData.isGameStart === false) {
                let countdownTxt = cc.find('Canvas/stage2/boxRoom/txtCountdown/countdown').getComponent(cc.Label);
                countdownTxt.string = '';

                let txt = cc.find('Canvas/stage2/boxRoom/txtCountdown/txt').getComponent(cc.Label);
                txt.string = '秒后开始游戏';

                if (data.event === Const.READY_TO_GAME_START_EVENT) {

                }
                if (data.event === Const.READY_GAME_TIME_EVENT) {
                    countdownTxt.string = data.time;
                }
                if (data.event === Const.CLOSE_READY_TO_GAME_START_EVENT) {
                    countdownTxt.string = '';
                    txt.string = '等待开始游戏(至少3人)';
                    GameData.canLeaveRoom = true;
                }
                if (data.event === Const.CANNOT_LEAVE_ROOM_EVENT) {
                    GameData.canLeaveRoom = false;
                }
                if (data.event === Const.GAME_START_EVENT) {
                    this.shouldStartGame();
                }

                // 僵尸房间的处理
                if (data.event === Const.GAME_HAS_START_EVENT) {
                    // 5秒内(或在此之前)没有收到其他玩家还存活的情况
                    // 就joinOver,然后离开房间
                    this.timer = setTimeout(() => {

                        // TODO:
                        if (GameData.isUserInTheRoom === true) {
                            if (!!this.timer) {
                                clearTimeout(this.timer);
                                return;
                            }
                        }

                        console.log('房间内其他玩家异常了,我们需要调用joinOver,然后离开房间');

                        this.zombieRoomHandler();

                    }, 5000);
                }
            }
        }
    },

    // 僵尸房间
    // 如果房间中其他成员都已经与服务器断开或异常了, 我们就认为是一个僵尸房间
    // 对于僵尸房间的处理是, joinOver, leaveRoom
    zombieRoomHandler() {
        // TODO: mvsUnBind
        Mvs.response.joinOverResponse = (rsp) => {
            if (rsp.status === 200) {
                console.log('response join over ok', rsp);
            } else {
                console.error('response join over error', rsp);
                return;
            }


            // 离开房间
            Mvs.response.leaveRoomResponse = (rsp) => {
                if (rsp.status === 200) {
                    // TODO:
                    // 没有去修改GameData.leaveRoomStatus的值
                    // 如果这里出现问题
                    console.log('response leave room ok', rsp);
                } else {
                    console.error('response leave room error', rsp);
                    return;
                }

                this.showPrompt('房间异常 自动退出');

                this.resetSomeGameData();
                this.consoleGameData();
                this.clearRoomList();
                this.hideRoomView();

            };

            // cpProto = ""
            let result = Mvs.engine.leaveRoom('');

            if (result === 0) {
                console.log('sdk leave room ok', result);
            } else {
                console.error('sdk leave room error', result);
            }


        };

        // cpProto = ""
        let result = Mvs.engine.joinOver('');
        if (result === 0) {
            console.log('sdk join over ok', result);
        } else {
            console.error('sdk join over error', result);
        }
    },

    shouldStartGame() {
        if (GameData.isGameStartCountdowning === true) {
            let data = JSON.stringify({
                event: Const.GAME_START_EVENT,
                isClient: true,
                isGameStart: false,
            });

            let result = Mvs.engine.sendEvent(data);
            if (result.result === 0) {

            } else {
                console.error('sdk sendEvent "GAME_START_EVENT"(GameData.isGameStartCountdowning === true) error', result);
            }
        }

        this.mvsUnBind();

        GameData.isGameStart = true;
        // console.log("loadScene game");
        try {
            wx.offHide(this.onHideHandler.bind(this))
        } catch(e) {
            cc.game.off(cc.game.EVENT_HIDE);
        }

        cc.director.loadScene('game');
    },

    // 踢人
    // BUG kickPlayerBtnHanlder -> kickPlayerBtnHandler 改了名字没用,还是kickPlayerBtnHanlder
    kickPlayerBtnHanlder(e, i) {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        if (GameData.isOwner === false) {
            return;
        }

        let nodes = cc.find('Canvas/stage2/boxRoom/playerList').children;
        // userName
        let userName = nodes[i].getChildByName('username').getComponent(cc.Label).string;

        if (userName === '--') {
            return;
        }

        let userId = -1
        for (let i = 0, len = GameData.players.length; i < len; i++) {
            if (GameData.players[i].userName === userName) {
                userId = GameData.players[i].userId
                break
            }
        }

        if (userId === -1) {
            return
        }

        // 踢人不应该对kickPlayerStatus处理
        let cpProto = '';
        this.mvsKickPlayer(userId, cpProto);
    },

    mvsKickPlayer(userId, cpProto) {
        let result = Mvs.engine.kickPlayer(userId, cpProto);

        if (result === 0) {
            GameData.kickPlayerStatus = 3;
            console.log('sdk kickPlayer ok', result);
        } else {
            GameData.kickPlayerStatus = 4;
            console.error('sdk kickPlayer error', result);
            // 不return
        }

        GameData.kickPlayerStatus = 5;
    },

    mvsKickPlayerResponse(rsp) {
        if (rsp.status === 200) {
            GameData.kickPlayerStatus = 6;
            console.log('response kickPlayer ok', rsp);
        } else {
            GameData.kickPlayerStatus = 7;
            console.error('response kickPlayer error', rsp);
            return;
        }

        let userId = rsp.userID;

        let k = 0;
        for (let i = 0, l = GameData.players.length; i < l; i++) {
            if (userId === GameData.players[i].userId) {
                k = i;
                break
            }
        }

        if (k === 0) {
            console.error('kickPlayer, userId has something error');
            return;
        }

        GameData.players.splice(k, 1);

        let nodes = cc.find('Canvas/stage2/boxRoom/playerList').children;

        for (let i = 0, l = GameData.players.length; i < 6; i++) {
            let node = nodes[i];
            let label = node.getChildByName('username').getComponent(cc.Label);

            if (i < l) {
                // label.string = GameData.players[i].userId;
                label.string = GameData.players[i].userName;
            } else {
                label.string = '--';
            }
        }
    },

    mvsKickPlayerNotify(data) {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        if (data) {
            console.warn('notify kickPlayer ok', data);
        } else {
            console.error('notify kickPlayer error', data);
            return;
        }

        let cpProto = data.cpProto;
        let srcUserId = data.srcUserId;
        let kickUserId = data.userId;

        // 如果被踢的是自己
        if (kickUserId === Const.userId) {
            this.resetSomeGameData();

            this.consoleGameData();

            this.clearRoomList();
            this.hideRoomView();
        }
        else {
            let k = 0;
            for (let i = 0, l = GameData.players.length; i < l; i++) {
                if (kickUserId === GameData.players[i].userId) {
                    k = i;
                    break;
                }
            }

            if (k === 0) {
                console.error('kickPlayer, userId has someting error');
                return;
            }

            GameData.players.splice(k, 1);

            let nodes = cc.find('Canvas/stage2/boxRoom/playerList').children;

            let players = [];
            for (let i = 0, l = GameData.players.length; i < l; i++) {
                let _player = GameData.players[i];
                players[i] = {};

                players[i].userId = _player.userId;
                players[i].userName = _player.userName;
            }

            let j = players.length;
            let m = 0;

            for (let i = 0; i < j; i++) {
                let player = players[i];
                if (player.userId === GameData.ownerId) {
                    m = i;
                    break;
                }
            }

            let mePlayer = players[0];
            players[0] = players[m];
            players[m] = mePlayer;

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

    },

    resetSomeGameData() {
        GameData.foodCounter = 0;
        GameData.foodIdCounter = 0;
        GameData.foodArr = [];

        GameData.players.splice(1);

        GameData.roomId = 0;
        GameData.ownerId = 0;
        GameData.isOwner = false;

        GameData.isGameStart = false;
        GameData.isGameOver = false;
        GameData.isGameWin = false;
        GameData.gameTime = 180;

        GameData.gameStartEventSequence = 0;

        GameData.isInRoomView = false;
        GameData.isQuickJoinBtnClick = false;
        GameData.isCreateRoomBtnClick = false;
        GameData.isJoinRoomBtn1Click = false;
        GameData.isJoinRoomBtn2Click = false;
        GameData.isRoomItemClick = false;

        GameData.canLeaveRoom = true;
        GameData.gameStartCountdownValue = 10;
        GameData.isGameStartCountdowning = false;
        GameData.isHasChangeOtherScore = false;
        GameData.isLeaveRoomBtn2Click = false;
        GameData.isHalfLeaveRoomBtnClick = false;

        GameData.isUserInTheRoom = false;
    },

    mvsUnBind() {
        Mvs.response.registerUserResponse = null;
        Mvs.response.loginResponse = null;
        Mvs.response.logoutResponse = null;

        Mvs.response.getRoomListResponse = null;

        Mvs.response.joinRoomResponse = null;
        Mvs.response.createRoomResponse = null;
        Mvs.response.leaveRoomResponse = null;

        Mvs.response.kickPlayerResponse = null;
        Mvs.response.kickPlayerNotify = null;

        Mvs.response.sendEventResponse = null;
        Mvs.response.sendEventNotify = null;

        Mvs.response.errorResponse = null;

        Mvs.response.networkStateNotify = null;

        // gameserver
        Mvs.response.gameServerNotify = null;
    },
});
