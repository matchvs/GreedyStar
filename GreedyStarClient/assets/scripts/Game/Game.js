var response = require("../Lib/MatchvsDemoResponse");
var msg = require("../Lib/MatvhvsMessage");
var GameData = require('../Global/GameData');
var utils = require('../Util/index');
var engine = require("../Lib/MatchvsEngine");
var Const = require('../Const/Const');
var MoveSync = require('MoveSync');
var MovePredict = require('MovePredict');
var stats = require('../Util/stats');

cc.Class({

    extends: cc.Component,

    properties: {
        vanishStarFoodList: [],
        vanishPeopleList: [],
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
        settingBtn: cc.Node,
        halfLeaveBtn: cc.Node,
        scoreItem: {
            default: null,
            type: cc.Node
        },
        scoreListView: cc.Node,
        scoreList: [],

        disGameOver: cc.Node,
        userScore: 0,
        scoreLable: {
            default: null,
            type: cc.Label
        },
        rankLable: {
            default: null,
            type: cc.Label
        },
        countDownLable: {
            default: null,
            type: cc.Label
        },
        camera: {
            default: null,
            type: cc.Node
        },
        rank: 0,
        countDown: 0,
        countDownTime: undefined,
        Seconds: 0,
        receiveMsgNum: 0,
        netDelayLable: {
            default: null,
            type: cc.Label
        },
        score: 0,
        speed: 100 / Const.FPS,
    },

    onLoad: function () {
        console.log("game", "load");
        this.mvsBind(this);
    },

    start: function () {
        console.log("game", "start");
        var self = this;
        this.scoreList = new Array();
        if (GameData.GameMode) {
            engine.prototype.sendEventEx(1, JSON.stringify({type: "startGame"}));
        } else {
            engine.prototype.sendEventEx(1, JSON.stringify({type: "ready"}));
        }
        engine.prototype.setReconnectTimeout(-1);
        this.settingBtn.on(cc.Node.EventType.TOUCH_END, function () {
            self.halfLeaveBtn.active = self.halfLeaveBtn.active ? false : true;
        });
        this.halfLeaveBtn.on(cc.Node.EventType.TOUCH_END, function () {
            engine.prototype.leaveRoom();
            self.halfOver();
        });
        self.sync = new MoveSync(this.onPlayersMove.bind(this));
        self.predicter = new MovePredict(this.onPlayersMoveDr.bind(this));
        this.pingTimer = setInterval(function () {
            engine.prototype.sendEventEx(1, JSON.stringify({
                type: "ping",
                data: new Date().getTime()
            }));
        }, 1000);
    },
    predictMove : function (input) {
        this.predicter.update(input);
    },
    onPlayersMoveDr: function (input) {
        var userSpeed = 10/ (1000/MovePredict.FPS);
        if (this.score >= Const.SPEED_DISSIPATION_SCORE && input.p == 1) {
            this.score -= Const.SPEED_DISSIPATION_SCORE;
            userSpeed = this.speed + Const.SPEED_UP;
        }
        var child = this.starLayer.getChildByName(Const.userID + "");

        if (input != null && child != null) {
            var isMove = false;
            var x,y;
            x = child.x ;
            y = child.y;
            if (1==input.l ) {
               x = child.x - userSpeed;
                isMove = true;
            }
            if (1 == input.r ) {
                x = child.x + userSpeed;
                isMove = true;
            }
            if (1 == input.u ) {
               y = child.y + userSpeed;
                isMove = true;
            }
            if (1 == input.d ) {
               y = child.y - userSpeed;
                isMove = true;
            }
            if(isMove){
                // child.stopAllActions();

                // if(child.actions.length==0){
                //     var action = cc.moveTo(1/Const.FPS, cc.v2(x, y));
                //     console.log("shadow.node x,"+ x+",y:"+ y);
                //     child.runAction(action);
                // }
                child.x = x;
                child.y = y;
            }
        }
    },
    onPlayersMove: function (players) {
        // self.showScoreList(players);
        for (var n = 0; n < players.length; n++) {
            var player = players[n];
            if (player.userID === Const.userID) {
                this.rank = n + 1;
                this.userScore = player.score;
            }
            var child = this.starLayer.getChildByName(player.userID + "");
            if (child !== null) {
                if (Math.abs(child.x - player.x) >= 500 ||
                    Math.abs(child.y - player.y) >= 500) {
                    child.stopAllActions();
                    child.x = player.x;
                    child.y = player.y;
                } else {
                    child.stopAllActions();
                    console.log("move anima")
                    var action = cc.moveTo(2*1 / Const.FPS, cc.v2(player.x, player.y));
                    console.log("real.node x,"+player.x+",y:"+player.y);
                    child.runAction(action);
                }
            }
        }
    },
    pingTimer: 0,
    /**
     * 相机跟随
     */
    lateUpdate: function () {

        var targetPos = this.getUserTargetPos();
        if (targetPos !== undefined) {
            if (Math.abs(targetPos.x - this.camera.x) >= 500 ||
                Math.abs(targetPos.y - this.camera.y) >= 500) {
                // targetPos.stopAllActions();
                this.camera.position = this.camera.parent.convertToNodeSpaceAR(targetPos);
            } else {
                if (Math.abs(targetPos.x - this.camera.x) >= 120 ||
                    Math.abs(targetPos.y - this.camera.y) >= 120) {//when camera and target distance is larger than max distance
                    this.startFollow = true;
                }
                if (this.startFollow) {
                    this.camera.position = this.camera.position.lerp(this.camera.parent.convertToNodeSpaceAR(targetPos), 0.05);
                    if (targetPos.sub(this.camera.position).mag() <= 30) {
                        this.startFollow = false;
                    }
                }
            }
            var camerRectInMap = cc.rect(this.camera.position.x - 480, this.camera.position.y - 320, 1500, 1000);
            var m_pViewEntitys = this.starLayer.children;
            for (var i = 2; i < m_pViewEntitys.length; i++) {
                var pEntity = m_pViewEntitys[i];
                if (pEntity) {
                    var targetPos1 = pEntity.getPosition();
                    if (camerRectInMap.contains(targetPos1)) {
                        if (!cc.RenderComponent) {
                            pEntity._sgNode.visibility = true;
                        } else {
                            pEntity.active = true;
                        }
                    } else {
                        if (!cc.RenderComponent) {
                            pEntity._sgNode.visibility = false;
                        } else {
                            pEntity.active = false;
                        }
                    }
                }
            }
        }
    },

    getUserTargetPos: function () {
        var targetPos;
        for (var k = 0; k < this.starLayer.children.length; k++) {
            if (this.starLayer.children[k].name == Const.userID) {
                targetPos = this.starLayer.children[k].parent.convertToWorldSpaceAR(this.starLayer.children[k].position);
                if (targetPos !== undefined) {
                    return targetPos;
                }
            }
        }
        return undefined;
    },


    onKeyDown: function (event) {
        switch (event.keyCode) {
            case 6:
                this.halfOver()
                break;
        }
    },


    mvsBind: function (self) {
        response.prototype.init(self);
        this.node.on(msg.MATCHVS_GAME_SERVER_NOTIFY, this.onEvent, this);
        this.node.on(msg.MATCHVS_LEAVE_ROOM, this.onEvent, this);
        this.node.on(msg.PING, this.onEvent, this);
    },


    onEvent: function (event) {
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

    /**
     * 接收GameServer消息
     * @param event
     */
    onUIEvent: function (event) {
        var particleSystem;
        var color;
        var colorArr = utils.getRandomColor();
        switch (event.type) {
            case "addFood":
                console.log("game", "addFood");
                this.addFood(event.data);
                break;
            case "removeFood":
                for (var j = 0; j < this.starLayer.children.length; j++) {
                    if (this.starLayer.children[j].name == event.data) {
                        var star = this.starLayer.children[j];
                        star.active = false;
                        this.vanishStarFoodList.push(star);
                        break;
                    }
                }
                break;
            case "addPlayer":
                console.log("game", "addPlayer");
                color = new cc.Color(colorArr[0], colorArr[1], colorArr[2])
                var tempPlayer = event.data;

                if (!this.starLayer.getChildByName(tempPlayer.userID+"")){
                    var node1 = cc.instantiate(this.playPrefab);
                    var userName = node1.getChildByName('userName').getComponent(cc.Label);
                    userName.string = tempPlayer.userID + "";
                    node1.x = tempPlayer.x;
                    node1.y = tempPlayer.y;
                    particleSystem = node1.getComponent(cc.ParticleSystem);
                    // particleSystem.startSize = tempPlayer.size;
                    particleSystem.startColor = color;
                    particleSystem.positionType = 0;
                    node1.name = tempPlayer.userID + "";
                    this.starLayer.addChild(node1);
                    console.log("add node x,"+node1.x+",y:"+node1.y);
                }
                var targetPos = this.getUserTargetPos();
                if (targetPos !== undefined) {
                    this.camera.position = this.camera.parent.convertToNodeSpaceAR(targetPos);
                }
                break;
            case "otherPlayer":
                console.log("game", "otherPlayer");
                this.addPlayers(event.data);
                break;
            case "removePlayer":
                var tempPlayer3 = event.data;
                for (var k = 0; k < this.starLayer.children.length; k++) {
                    if (this.starLayer.children[k].name == tempPlayer3.userID) {
                        this.starLayer.removeChild(this.starLayer.children[k]);
                    }
                }
                break;
            case "move":
                this.receiveMsgNum++;
                if (this.Seconds !== new Date().getSeconds()) {
                    this.netDelayLable.string = "每秒收到移动包的数量：" + this.receiveMsgNum;
                    this.receiveMsgNum = 0;
                    this.Seconds = new Date().getSeconds();
                }
                // this.sync.update(event.data);//push to cache
                this.onPlayersMove(event.data);
                break;
            case "GameOver":
                engine.prototype.leaveRoom();
                break;
            case "startGame":
                var room = event.data;
                this.addPlayers(room);
                if (GameData.GameMode) {
                    this.countDown = Math.floor(event.profile / Const.FPS);
                    this.textCountDown();
                }
                break;
            case "countDown":
                this.countDown = Math.floor(event.data / Const.FPS);
                this.textCountDown();
                break;
            case "die":
                var child = this.starLayer.getChildByName(event.data + "");
                child&&(child.active = false);
                // if (Const.userID === event.data) {
                //
                // }


                break;
            case "ping":
                var ping = new Date().getTime() - event.data;
                stats.statsUpload(ping, Const.userID);
                break;

        }
    },


    /**
     * 倒计时
     */
    textCountDown: function () {
        if (this.countDownTime === undefined) {
            this.countDownTime = setInterval(function () {
                this.countDown--;
                if (this.countDown >= 0) {
                    this.countDownLable.string = this.countDown + "  s";
                }
            }, 1000);
        }
    },

    // 优化食物加载逻辑
    addFood: function (data) {
        var colorArr = utils.getRandomColor(), color, particleSystem;
        color = new cc.Color(colorArr[0], colorArr[1], colorArr[2])
        for (var i = 0; i < data.length; i++) {
            var node = this.vanishStarFoodList[i];
            if (node) {
                particleSystem = node.getComponent(cc.ParticleSystem);
                particleSystem.startSize = data[i].size;
                particleSystem.startColor = color;
                node.x = data[i].x;
                node.y = data[i].y;
                node.name = "" + data[i].ID;
                node.active = true;
                this.vanishStarFoodList.splice(i, 1);
            } else {
                node = cc.instantiate(this.starPrefab);
                particleSystem = node.getComponent(cc.ParticleSystem);
                particleSystem.startSize = data[i].size;
                particleSystem.startColor = color;
                node.x = data[i].x;
                node.y = data[i].y;
                node.name = "" + data[i].ID;
                this.starLayer.addChild(node);
            }
        }
    },

    /**
     * 添加玩家
     * @param userList
     */
    addPlayers: function (userList) {
        var colorArr = utils.getRandomColor(), color, particleSystem;
        for (var c = 0; c < userList.length; c++) {
            color = new cc.Color(colorArr[0], colorArr[1], colorArr[2]);
            var node2 = cc.instantiate(this.playPrefab);
            var userName = node2.getChildByName('userName').getComponent(cc.Label);
            userName.string = userList[c].userID + "";
            node2.x = userList[c].x;
            node2.y = userList[c].y;
            particleSystem = node2.getComponent(cc.ParticleSystem);
            particleSystem.startSize = userList[c].size;
            particleSystem.startColor = color;
            node2.name = userList[c].userID + "";
            this.starLayer.addChild(node2);
        }
    },

    showClose: function () {
        this.disGameOver.active = true;
        this.scoreLable.string = this.userScore;
        this.rankLable.string = this.rank;
    },

    /**
     * 退出游戏
     */
    halfOver: function () {
        this.node.stopAllActions();
        this.mvsUnBind();
        cc.director.loadScene('lobby', function () {
            this && this.hidePromptError && this.hidePromptError();
        });
    },

    mvsUnBind: function () {
        this.node.off(msg.MATCHVS_GAME_SERVER_NOTIFY, this);
        this.node.off(msg.MATCHVS_LEAVE_ROOM, this);
        this.node.off(msg.PING, this);
    },

    /**
     * 展示分数列表
     * @param infoData
     */
    showScoreList: function (infoData) {
        var spacing = 5;
        var item;
        this.scoreList = infoData;
        this.totalCount = this.scoreList.length;
        this.scoreListView.height = this.totalCount * (this.scoreItem.height + spacing) + spacing;
        var itemNum = this.scoreList.length - this.scoreListView.children.length;
        if (itemNum >= 0) {
            for (var i = 0; i < itemNum; i++) {
                item = cc.instantiate(this.scoreItem);
                item.name = i + "";
                this.scoreListView.addChild(item);
            }
        } else {
            this.scoreListView.children.length + itemNum;
        }
        for (var i = 0; i < this.scoreListView.children.length; i++) {
            item = this.scoreListView.getChildByName(i + "");
            item.setPosition(0, -item.height * (0.5 + i) - spacing * (i + 1));
            item.getComponent('Item').updateItem(this.scoreList[i]);
        }
    },

    onDestroy: function () {
        clearInterval(this.countDownTime);
        clearInterval(this.pingTimer);
        this.predicter&&this.predicter.dispose();
        this.sync&&this.sync.dispose();
    },


});
