var response = require("../Lib/MatchvsDemoResponse");
var msg = require("../Lib/MatvhvsMessage");
let GameData = require('../Global/GameData');
let utils = require('../Util/index');
var engine = require("../Lib/MatchvsEngine");
let Const = require('../Const/Const');

cc.Class({
    extends: cc.Component,

    properties: {
        starFoodList:[],
        // 引用星星预支资源
        starPrefab: {
            default: null,
            type: cc.Prefab
        },

        playPrefab: {
            default: null,
            type: cc.Prefab
        },

        starLayer: {
            default: null,
            type: cc.Node
        },
        settingBtn:cc.Node,
        halfLeaveBtn:cc.Node,
        scoreItem:{
            default:null,
            type:cc.Node
        },
        scoreListView:cc.Node,
        scoreList :[],

        disGameOver:cc.Node,
        userScore:0,
        scoreLable:{
            default: null,
            type: cc.Label
        },
        rankLable:{
            default: null,
            type: cc.Label
        },
        countDownLable:{
            default: null,
            type: cc.Label
        },
        rank:0,
        countDown:0,
        countDownTime:undefined
    },

    onLoad() {
        var  self = this;
        this.scoreList = new  Array();
        this.mvsBind(this);
        this.settingBtn.on(cc.Node.EventType.TOUCH_END, function (event) {
            self.halfLeaveBtn.active = self.halfLeaveBtn.active? false:true;
        });
        this.halfLeaveBtn.on(cc.Node.EventType.TOUCH_END,function(event) {
            engine.prototype.leaveRoom();
            self.halfOver();
        });
    },


    lateUpdate:function() {
        let targetPos;
        for (var k = 0; k < this.starLayer.children.length; k++) {
            if (this.starLayer.children[k].name == Const.userID) {
                targetPos = this.starLayer.children[k].parent.convertToWorldSpaceAR(this.starLayer.children[k].position);
            }
        }
        if (targetPos !== undefined) {
            this.node.position = this.node.parent.convertToNodeSpaceAR(targetPos);
        }
    },

    onKeyDown(event) {
        switch (event.keyCode) {
            case 6:
                this.halfOver()
                break;
        }
    },


    mvsBind(self) {
        response.prototype.init(self);
        this.node.on(msg.MATCHVS_GAME_SERVER_NOTIFY, this.onEvent, this);
        this.node.on(msg.MATCHVS_LEAVE_ROOM, this.onEvent, this);
    },


    onEvent(event) {
        var eventData = event.detail;
        if (eventData == undefined) {
            eventData = event;
        }
        switch (event.type) {
            case msg.MATCHVS_GAME_SERVER_NOTIFY:
                var data = JSON.parse(eventData.eventInfo.cpProto);
                this.onUIEvent(data)
                break;
            case msg.MATCHVS_LEAVE_ROOM:
                this.showClose();
                break;
        }
    },

    onUIEvent(event) {
        var particleSystem ;
        var color;
        let colorArr = utils.getRandomColor();
        switch (event.type) {
            case "addFood":
                this.addFood(event.data);
                break;
            case "removeFood":
                for (var j = 0; j < this.starLayer.children.length; j++) {
                    if (this.starLayer.children[j].name == event.data) {
                        var star = this.starLayer.children[j];
                        this.starLayer.removeChild(star, true);
                        break;
                    }
                }
                break;
            case "addPlayer":
                console.log("addPlayer");
                color = new cc.Color(colorArr[0], colorArr[1], colorArr[2])
                var tempPlayer = event.data;
                let node1 = cc.instantiate(this.playPrefab);
                node1.x = tempPlayer.x;
                node1.y = tempPlayer.y;
                particleSystem = node1.getComponent(cc.ParticleSystem);
                particleSystem.startSize = tempPlayer.size;
                particleSystem.startColor = color;
                particleSystem.positionType = 0;
                node1.name = tempPlayer.userID + "";
                this.starLayer.addChild(node1);
                break;
            case "otherPlayer":
                console.log("otherPlayer");
                this.addPlayers(event.data);
                break;
            case "removePlayer":
                var tempPlayer3 = event.data;
                console.log("[INFO] removePlayer user:" + tempPlayer3);
                for (var k = 0; k < this.starLayer.children.length; k++) {
                    console.log("[INFO] removePlayer.node.name " + this.starLayer.children[k].name);
                    if (this.starLayer.children[k].name == tempPlayer3.userID) {
                        this.starLayer.removeChild(this.starLayer.children[k]);
                    }
                }
                break;
            case "move":
                var players = event.data;
                this.showScoreList(players);
                for (var n = 0; n < players.length; n++) {
                    this.rank = n;
                    var player = players[n];
                    var child = this.starLayer.getChildByName(player.userID + "");
                    if (child !== null ) {
                        child.x = player.x;
                        child.y = player.y;
                        this.userScore = player.score;
                        particleSystem = child.getComponent(cc.ParticleSystem);
                        particleSystem.startSize = player.size;
                    }
                }
                break;
            case "GameOver":
                engine.prototype.leaveRoom();
                break;
            case "startGame":
                console.log("收到startGame消息");
                let room = event.data;
                this.addPlayers(room);
                break;
            case "countDown":
                this.countDown = event.data;
                this.textCountDown();
                break;

        }
    },

    textCountDown() {
        if ( this.countDownTime === undefined) {
            this.countDownTime = setInterval(() => {
                this.countDown --;
            }, 1000);
            if(this.countDown > 0) {
                this.countDownLable.string  = this.countDown+"  s";
            }
        }

    },

    addFood(data) {
        let colorArr = utils.getRandomColor(),color,particleSystem;
        for (var i = 0; i < data.length; i++) {
            color = new cc.Color(colorArr[0], colorArr[1], colorArr[2])
            let node = cc.instantiate(this.starPrefab);
            particleSystem = node.getComponent(cc.ParticleSystem);
            particleSystem.startSize = data[i].size;
            particleSystem.startColor = color
            node.x = data[i].x;
            node.y = data[i].y;
            node.name = "" + data[i].ID;
            this.starLayer.addChild(node);
        }
    },

    addPlayers(userList) {
        let colorArr = utils.getRandomColor(),color,particleSystem;
        for (var c = 0; c < userList.length; c++) {
            color = new cc.Color(colorArr[0], colorArr[1], colorArr[2]);
            let node2 = cc.instantiate(this.playPrefab);
            node2.x = userList[c].x;
            node2.y = userList[c].y;
            particleSystem = node2.getComponent(cc.ParticleSystem);
            particleSystem.startSize = userList[c].size;
            particleSystem.startColor = color;
            node2.name = userList[c].userID + "";
            this.starLayer.addChild(node2);
        }
    },

    showClose () {
        this.disGameOver.active = true;
        this.scoreLable.string = this.userScore;
        this.rankLable.string = this.rank;
    },

    halfOver() {
        this.node.stopAllActions();
        this.mvsUnBind();
        cc.director.loadScene('lobby', () => {
            this && this.hidePromptError && this.hidePromptError();
        });
    },

    mvsUnBind() {
        this.node.off(msg.MATCHVS_GAME_SERVER_NOTIFY, this);
        this.node.off(msg.MATCHVS_LEAVE_ROOM, this);
    },

    showScoreList: function (infoData) {
        let spacing = 5;
        this.scoreList = infoData;
        this.totalCount  = this.scoreList.length;
        this.scoreListView.height = this.totalCount*(this.scoreItem.height + spacing) + spacing;
        this.scoreListView.removeAllChildren(true);
        for(var i = 0; i < this.scoreList.length;i++) {
            var item = cc.instantiate(this.scoreItem);
            this.scoreListView.addChild(item);
            item.setPosition(0, -item.height * (0.5 + i) - spacing * (i + 1));
            item.getComponent('Item').updateItem(this.scoreList[i]);
        }
    },


    /**
     * 游戏倒计时定时器
     */
    // countDown() {
    //     let txtCountdown = cc.find('Canvas/txtCountdown').getComponent(cc.Label);
    //     // TODO: 可以直接在结束是clearInterval
    //     // TODO: 改写定时器的逻辑
    //     let timer = setInterval(() => {
    //         GameData.gameTime--;
    //         if (GameData.isInCoverView === true) {
    //             clearInterval(timer);
    //             return;
    //         }
    //         if (GameData.gameTime <= 0) {
    //             txtCountdown.string = '0s';
    //             clearInterval(timer);
    //             // 延迟1ms自动退出房间
    //             setTimeout(() => {
    //                 if (GameData.isHalfLeaveRoomBtnClick === false) {
    //                     GameData.leaveRoomStatus = 2;
    //                     let cpProto = "";
    //                     this.mvsLeaveRoom(cpProto);
    //                 }
    //             }, 1000);
    //         }
    //
    //         // if (GameData.gameTime === 120) {
    //             // if (GameData.gameTime === 170) {
    //             let userID = GameData.players[0].userID;
    //             for (let i = 0, l = GameData.players.length; i < l; i++) {
    //                 if (userID > GameData.players[i].userID) {
    //                     userID = GameData.players[i].userID;
    //                 }
    //             }
    //             this.mvsJoinOver();
    //         // }
    //         txtCountdown.string = GameData.gameTime + 's';
    //     }, 1000);
    //
    //     this.timer = timer;
    // },


});
