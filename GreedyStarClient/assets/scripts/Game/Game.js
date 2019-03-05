let response = require("../Lib/MatchvsDemoResponse");
let msg = require("../Lib/MatvhvsMessage");
let GameData = require('../Global/GameData');
let utils = require('../Util/index');
let engine = require("../Lib/MatchvsEngine");
let Const = require('../Const/Const');
let MoveSync = require('MoveSync');

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
        }
    },

    onLoad() {
        this.mvsBind(this);
    },
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
            let camerRectInMap = cc.rect(this.camera.position.x - 480, this.camera.position.y - 320, 1500, 1000);
            var m_pViewEntitys = this.starLayer.children;
            for (var i = 2; i < m_pViewEntitys.length; i++) {
                var pEntity = m_pViewEntitys[i];
                if (pEntity.name.indexOf("player") === -1) {
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
                } else {
                    if (!cc.RenderComponent) {
                        pEntity._sgNode.visibility = true;
                    } else {
                        pEntity.active = true;
                    }
                }
            }
        }
    },


    start() {
        console.log("game", "start");
        var self = this;
        this.scoreList = new Array();
        if (GameData.GameMode) {
            engine.prototype.sendEventEx(1, JSON.stringify({type: "startGame"}));
        } else {
            engine.prototype.sendEventEx(1, JSON.stringify({type: "ready"}));
        }
        this.settingBtn.on(cc.Node.EventType.TOUCH_END, function () {
            self.halfLeaveBtn.active = self.halfLeaveBtn.active ? false : true;
        });
        this.halfLeaveBtn.on(cc.Node.EventType.TOUCH_END, function () {
            engine.prototype.leaveRoom();
            self.halfOver();
        });
        self.sync = new MoveSync(function (players) {
            self.showScoreList(players);
            for (var n = 0; n < players.length; n++) {
                var player = players[n];

                if (player.userID === Const.userID) {
                    self.rank = n + 1;
                    self.userScore = player.score;
                }
                var child = self.starLayer.getChildByName(player.userID + "");
                if (child !== null) {
                    if (player.status === 2) {
                        child.stopAllActions();
                        self.action = cc.moveTo(0.1, cc.v2(player.x, player.y));
                        child.runAction(self.action);
                    } else {
                        child.visible = false;
                        child.stopAllActions();
                        child.x = player.x;
                        child.y = player.y;
                    }
                    // if (Math.abs(child.x - player.x) >= 500 ||
                    // Math.abs(child.y - player.y) >= 500) {
                    // } else {
                    // }
                }
            }
        });
    },

    getUserTargetPos() {
        let targetPos;
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

    /**
     * 接收GameServer消息
     * @param event
     */
    onUIEvent(event) {
        var particleSystem;
        var color;
        let colorArr = utils.getRandomColor();
        switch (event.type) {
            case "addFood":
                console.log("game", "addFood");
                this.addFood(event.data);
                break;
            case "removeFood":
                for (var j = 0; j < this.starLayer.children.length; j++) {
                    if (this.starLayer.children[j].name == event.data) {
                        let star = this.starLayer.children[j];
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
                let node1 = cc.instantiate(this.playPrefab);
                let userName = node1.getChildByName('userName').getComponent(cc.Label);
                userName.string = tempPlayer.userID + "";
                node1.x = tempPlayer.x;
                node1.y = tempPlayer.y;
                particleSystem = node1.getComponent(cc.ParticleSystem);
                // particleSystem.startSize = tempPlayer.size;
                particleSystem.startColor = color;
                particleSystem.positionType = 0;
                node1.name = tempPlayer.userID + "";
                this.starLayer.addChild(node1);
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
                this.sync.update(event.data);
                // let players = event.data;
                // this.showScoreList(players);
                // for (var n = 0; n < players.length; n++) {
                //     var player = players[n];
                //     if (player.userID === Const.userID) {
                //         this.rank = n + 1;
                //         this.userScore = player.score;
                //     }
                //     var child = this.starLayer.getChildByName(player.userID + "");
                //     if (child !== null) {
                //         this.action = cc.moveTo(0.05, cc.v2(player.x, player.y));
                //         child.stopAllActions();
                //         child.runAction(this.action);
                //     }
                // }
                break;
            case "GameOver":
                engine.prototype.leaveRoom();
                break;
            case "startGame":
                let room = event.data;
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
                child.active = false;
                // if (Const.userID === event.data) {
                //
                // }
                break;
        }
    },


    /**
     * 倒计时
     */
    textCountDown() {
        if (this.countDownTime === undefined) {
            this.countDownTime = setInterval(() => {
                this.countDown--;
                if (this.countDown >= 0) {
                    this.countDownLable.string = this.countDown + "  s";
                }
            }, 1000);
        }
    },

    // 优化食物加载逻辑
    addFood(data) {
        let colorArr = utils.getRandomColor(), color, particleSystem;
        color = new cc.Color(colorArr[0], colorArr[1], colorArr[2])
        for (var i = 0; i < data.length; i++) {
            let node = this.vanishStarFoodList[i];
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
    addPlayers(userList) {
        let colorArr = utils.getRandomColor(), color, particleSystem;
        for (var c = 0; c < userList.length; c++) {
            color = new cc.Color(colorArr[0], colorArr[1], colorArr[2]);
            let node2 = cc.instantiate(this.playPrefab);
            let userName = node2.getChildByName('userName').getComponent(cc.Label);
            userName.string = userList[c].userID + "";
            node2.x = userList[c].x;
            node2.y = userList[c].y;
            particleSystem = node2.getComponent(cc.ParticleSystem);
            particleSystem.startSize = userList[c].size;
            particleSystem.startColor = color;
            node2.name = "player" + userList[c].userID + "";
            this.starLayer.addChild(node2);
        }
    },

    showClose() {
        this.disGameOver.active = true;
        this.scoreLable.string = this.userScore;
        this.rankLable.string = this.rank;
    },

    /**
     * 退出游戏
     */
    halfOver() {
        this.node.stopAllActions();
        this.mvsUnBind();
        cc.director.loadScene('lobby');
    },

    mvsUnBind() {
        this.node.off(msg.MATCHVS_GAME_SERVER_NOTIFY, this);
        this.node.off(msg.MATCHVS_LEAVE_ROOM, this);
    },

    /**
     * 展示分数列表
     * @param infoData
     */
    showScoreList: function (infoData) {
        let spacing = 5;
        let item;
        this.scoreList = infoData;
        this.totalCount = this.scoreList.length;
        this.scoreListView.height = this.totalCount * (this.scoreItem.height + spacing) + spacing;
        // this.scoreListView.removeAllChildren(true);
        let itemNum = this.scoreList.length - this.scoreListView.length;


        if (itemNum  >= 0) {
            for (var i = 0; i < itemNum; i++) {
                item = cc.instantiate(this.scoreItem);
                this.scoreListView.addChild(item);
            }
        } else {
            this.scoreListView.length + itemNum;
        }

        for(var i = 0; i < this.scoreListView.length;i++) {
            item = this.scoreListView.getChildByTag(i);
            item.setPosition(0, -item.height * (0.5 + i) - spacing * (i + 1));
            item.getComponent('Item').updateItem(this.scoreList[i]);
        }

        // for (var i = 0; i < this.scoreList.length; i++) {
        //
        //     // this.scoreListView.addChild(item);
        //     if (this.scoreList.getChildByTag(i)) {
        //         item = this.scoreList.getChildByTag(i);
        //     } else {
        //         item = cc.instantiate(this.scoreItem);
        //         this.scoreListView.addChild(item);
        //     }
        //
        // }
    },

    onDestroy() {
        clearInterval(this.countDownTime);
    },


});
