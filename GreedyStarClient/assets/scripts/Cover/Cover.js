let Const = require('../Const/Const');
let GameData = require('../Global/GameData');
var engine = require("../Lib/MatchvsEngine");
var response = require("../Lib/MatchvsDemoResponse");
var msg = require("../Lib/MatvhvsMessage");
let wxshare = require('../Util/wxshare');

cc.Class({
    extends: cc.Component,

    onLoad() {
        //不展示FSP信息
        // cc.director.setDisplayStats(false);
        // 监听键盘
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN,this.onKeyDown,this);
        LocalStore_Clear();
        this.initEvent(this);
    },

    initEvent(self) {
        response.prototype.init(self);
        this.node.on(msg.MATCHVS_ERROE_MSG, this.onEvent, this);
        this.node.on(msg.MATCHVS_INIT, this.onEvent, this);
        this.node.on(msg.MATCHVS_REGISTER_USER,this.onEvent,this);
        this.node.on(msg.MATCHVS_LOGIN,this.onEvent,this);
    },

    /**
     * 初始化
     */
    init() {
        var result;
        if (GameData.isPremiseInit) {
            var endport = "172.25.119.77";
            var gameID = 201226 ;
            result = engine.prototype.premiseInit(endport,gameID)
        } else {
            result = engine.prototype.init(Const.channel,Const.platform,Const.gameID)
        }
        if (result !== 0) {
            this.showPromptOfError('初始化[sdk]失败 请刷新 重试',true);
        }
    },

    onEvent(event) {
        var eventData = event.detail;
        if (eventData == undefined) {
            eventData = event;
        }
        switch (event.type) {
            case msg.MATCHVS_INIT:
                if (eventData.status === 200) {
                    engine.prototype.registerUser();
                } else {
                    this.showPromptOfError('初始化失败 请重试',true);
                }
                break;
            case msg.MATCHVS_REGISTER_USER:
                this.login(eventData.userInfo.id,eventData.userInfo.token);
                break;
            case msg.MATCHVS_LOGIN:
                this.showPromptOfError("",false);
                cc.director.loadScene('lobby');
                break;
            case msg.MATCHVS_ERROE_MSG:
                this.mvsErrorResponse(eventData.errorCode,eventData.errorMsg);
                break;
        }
    },

    /**
     * 登录
     * @param id
     * @param token
     */
    login (id, token) {
        Const.userID = id;
        engine.prototype.login(id,token);
        try {
            wxshare.getWxUserInfo((userinfo) => {
                console.log("get wx.userinfo success ", userinfo);
                Const.userName = userinfo.nickName;
                Const.avatarUrl = userinfo.avatarUrl;
            });
        } catch (error) {
            console.log("get wx.userinfo is fail" + error);
        }

    },

    mvsErrorResponse(code, errMsg) {
        if (code === 1001) {
            this.showPromptOfError('你已掉线请重新登录',true);
            console.log(code,errMsg);
        }
    },

    showPromptOfError(str,isShow) {
        let promptNode = cc.find('Canvas/prompt');
        if (isShow) {
            let promptTxt = promptNode.getChildByName('label').getComponent(cc.Label);
            promptTxt.string = str;
            promptNode.active = true;
        } else {
            promptNode.active = false;
        }
    },

    onKeyDown:function(event) {
        console.warn('keyCode',event.keyCode);
        switch (event.keyCode) {
            case 1005:
                this.play();
                break;
        }
    },

    removeEvent () {
        this.node.off(msg.MATCHVS_ERROE_MSG, this.onEvent, this);
        this.node.off(msg.MATCHVS_INIT, this.onEvent, this);
        this.node.off(msg.MATCHVS_REGISTER_USER,this.onEvent,this);
        this.node.off(msg.MATCHVS_LOGIN,this.onEvent,this);
        this.node.off(msg.MATCHVS_WX_BINDING,this.onEvent,this);
        this.node.off(msg.MATCHVS_RE_CONNECT,this.onEvent,this);
    },

    onDestroy() {
        this.removeEvent();
        console.log("Cover页面销毁");
    }
 });
