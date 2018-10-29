let Mvs = require('../../Lib/Mvs');
let utils = require('../../Util/index');
let Const = require('../../Const/Const');
let GameData = require('../../Global/GameData');

cc.Class({
    extends: cc.Component,


    properties: {
        userName:cc.Label,
        sendInterval:0,
        robotMoveToDistance : 9, // 机器人靠近主角时的移动速度
        robotMoveDistance :9, // 机器人四处随机移动时主角时的移动速度
        robotMoveSyncTime: 0
    },

    onLoad() {
        this.scaleAction = null;
        this.gameWidth = 2560;
        this.gameHeight = 1440;
        this.gameRect = cc.rect(-this.gameWidth / 2 - 5, -this.gameHeight / 2 - 5, this.gameWidth + 10, this.gameHeight + 10);
        this.originWidth = 0;
        this.isEdge = false;
    },

    start() {
        try {
            let node = this.node;
            let foo = node.x;
        } catch (e) {
            this.node = cc.find('Canvas/bg/player');
        }

        // 镜头跟随
        let mapBgNode = cc.find('Canvas/bg');
        let followAction = cc.follow(this.node);
        followAction.setTag(100);
        mapBgNode.stopActionByTag(100);
        mapBgNode.runAction(followAction);
        this.originWidth = this.node.width;
        GameData.players[0].lastWidth = this.originWidth || 40;
        try {
            let node = this.node;
            let foo = node.x;
        } catch (e) {
            this.node = cc.find('Canvas/bg/player');
        }

        this.userName.string = Const.userName;

        this.onEvents();

        // 延迟200ms出生
        setTimeout(() => {
            this.playerBirth();
        }, 200);
    },

    update(dt) {
        this.playerMove(dt);
        this.judgeIsEdge();
        this.robotMoveSyncTime++;
        if (this.robotMoveSyncTime === 6) {
            /**
             * 刷新机器人位置
             */
            this.robotMove();
            this.robotMoveSyncTime = 0;
        }

    },

    onEvents() {
        cc.director.GlobalEvent.on('playerEatAFood', this.playerAddSize, this);
        cc.director.GlobalEvent.on('playerSpeedUp', this.playerGoldMinus, this);
        cc.director.GlobalEvent.on('playerVivid', this.playerRevive, this);
        cc.director.GlobalEvent.on('iCanBeEaten', this.iCanBeEaten, this);
    },

    // 暂未使用
    offEvents() {
        cc.director.GlobalEvent.off('playerEatAFood', this);
        cc.director.GlobalEvent.off('playerSpeedUp', this);
        cc.director.GlobalEvent.off('playerVivid', this);
        cc.director.GlobalEvent.off('iCanBeEaten', this);
    },

    /**
     * 玩家出生
     */
    playerBirth() {
        this.node.userID = Const.userID;
        let position = this.getRandomPosition();
        let data = { userID: Const.userID, x: position.x, y: position.y, scale: 1, opacity: 255, isLive: 1, isInvin: 0, isRobot:false };
        cc.director.GlobalEvent.emit('playerBirth', data)
        this.changePlayerStatus(data);
        for(var i = 0; i < GameData.players.length;i++) {
            this.robotBirth(GameData.players[i],i);
        }
    },

    playerMove(dt) {
        if (!GameData.players[0].isLive) {
            return
        }
        let angle = GameData.angle
            , speed1 = GameData.speed1
            , speed2 = GameData.speed2;
        if (angle === null) {
            return
        }
        if (GameData.gold === 0) {
            speed2 = 0
        }
        let x = this.node.x
            , y = this.node.y
            , scale = this.node.scale;
        if (angle !== null && (speed1 || speed2)) {
            let speed = speed2 ? speed2 : speed1;
            x += Math.cos(angle * (Math.PI / 180)) * speed * dt;
            y += Math.sin(angle * (Math.PI / 180)) * speed * dt;
        }
        // 如果还是无敌,碰到地图,就不移动
        if (this.node.isInvin) {
            let r = GameData.players[0].lastWidth / 2
                , newX = x === 0 ? x : (x > 0 ? x + r : x - r)
                , newY = y === 0 ? y : (y > 0 ? y + r : y - r);
            if (!this.isContainsPoint(newX, newY, this.gameRect)) {
                return
            }
        }
        let data = {
            userID: GameData.players[0].userID, x, y, scale, isLive: 1,
        };
        this.sendInterval ++;
        if (this.sendInterval == 6) {
            this.emitPlayerMove(data);
            this.sendInterval = 0;
        }
        delete data.scale;
        this.changePlayerStatus(data)
    },

    judgeIsEdge() {
        if (this.isEdge === true) {
            return;
        }
        let x = this.node.x, y = this.node.y, r = GameData.players[0].lastWidth / 2;
        x = x === 0 ? x : (x > 0 ? x + r : x - r);
        y = y === 0 ? y : (y > 0 ? y + r : y - r);
        if (!this.isContainsPoint(x, y, this.gameRect) && !this.node.isInvin) {
            this.isEdge = true;
            let data = {userID: this.node.userID, scale: 1, opacity: 0, isLive: 0, isInvin: 0,};
            this.emitPlayerDie(data);
            data.score = 0;
            this.changePlayerStatus(data)
        }
    },

    /**
     * 与玩家的碰撞检测
     * @param other 其他玩家 包括机器人
     * @param self   自己
     */
    onCollisionEnter(other, self) {
        if (other.tag === 1 && self.tag === 1) {
            if (!other.node.isLive || !self.node.isLive) {
                return
            }
            if (other.node.isInvin || self.node.isInvin) {
                return
            }
            /**
             * 如果碰撞单位是机器人就另外一个逻辑
             */
            if (other.node.userID === GameData.robotIDs[0] || other.node.userID == GameData.robotIDs[1]) {
                this.robotCollision(other,self);
                return;
            }
            if (other.node.scale > self.node.scale) {
                if (GameData.dieDataBuffer !== undefined || GameData.dieDataBuffer !== null) {
                    GameData.dieDataBuffer = null;
                }
                GameData.dieDataBuffer = {
                    data: {
                        userID: self.node.userID, // die userId
                        scale: 1,
                        opacity: 0,
                        isLive: 0,
                        isInvin: 0,
                        score: GameData.players[0].score, // die user score
                        oUserID: other.node.userID, // other userId
                        oeo: true // 'other eat other'
                    },
                    oNode: other.node,
                };

                let data = JSON.stringify({
                    beEatUserID: self.node.userID,
                    eatUserID: other.node.userID,
                    event: Const.CAN_I_BE_EATEN
                });
                let result = Mvs.engine.sendEvent(data);
                let action = cc.blink(0.2, 5);
                self.node.runAction(action);
            }
        }
    },

    iCanBeEaten() {
        let data = GameData.dieDataBuffer.data;
        this.emitPlayerDie(data);
        data.score = 0;
        this.changePlayerStatus(data);
        let oUserID = data.oUserID, oScore = data.score, oIndex, oNode = data.oNode;
        for (let i = 0, l = GameData.players.length; i < l; i++) {
            let players = GameData.players[i];
            if (oUserID === players.userID) {
                oIndex = i;
                break;
            }
        }
        let otherScript = cc.find('Canvas/bg').getComponent('Other');
        otherScript.otherAddSize(oUserID, oScore, oIndex, oNode);
    },

    playerRevive(data) {
        this.isEdge = false;
        // bug
        if (GameData.players[0].isLive) {
            return;
        }
        GameData.players[0].lastWidth = this.originWidth;
        console.log('me revive', Const.userID);
        this.changePlayerStatus({
            x: data.x,
            y: data.y,
            scale: 1,
            opacity: 178,
            isLive: 1,
            isInvin: 1,
        });

        let timer = setTimeout(() => {
            if (!GameData.isGameStart || GameData.isGameOver) {
                clearTimeout(timer);
                return;
            }

            // 如果复活后, 3秒后还活着, 就把无敌关了
            if (this.node.isLive) {
                this.changePlayerStatus({
                    isInvin: 0,
                    opacity: 255
                })
            }
        }, 3000)
    },

    playerAddSize(data) {
        if (data.userId !== GameData.players[0].userId) {
            return;
        }

        let score = data.score
            , addWidth = score / 30
            , lastWidth = GameData.players[0].lastWidth
            , scaleAdd = (lastWidth + addWidth) / lastWidth;

        let scale;

        if (!!GameData.players[0].hasScaleAction) {
            if (!!this.scaleAction) {
                // 不是removeAction
                this.node.stopAction(this.scaleAction);
            }
            scale = Number(GameData.players[0].lastScale * scaleAdd).toFixed(2);
        } else {
            scale = Number(this.node.scale * scaleAdd).toFixed(2);
        }

        GameData.players[0].lastScale = scale; // 上一次应该放大的值
        GameData.players[0].hasScaleAction = true;
        GameData.players[0].lastWidth = lastWidth + addWidth;


        // 先发送事件
        let userId = GameData.players[0].userId;

        let _data = JSON.stringify({
            event: Const.OTHER_CHANGE_SIZE_EVENT,
            userId: userId,
            scale: scale,
            lastWidth: GameData.players[0].lastWidth
        });
        let result = Mvs.engine.sendEvent(_data);
        // 后动画
        this.scaleAction = cc.sequence(
            // BUG: 不能把预处理放在这里
            cc.scaleTo(0.5, Number(scale)).easing(cc.easeElasticInOut(0.5)),
        // this.scaleAction = cc.scaleTo(0.5, scale);
            cc.callFunc(() => {
                this.scaleAction = null;
                GameData.players[0].hasScaleAction = false;
            }),
        );

        this.node.runAction( this.scaleAction);
    },

    playerGoldMinus(data) {
        let gold = GameData.gold - data.gold;

        if (gold <= 0) {
            gold = 0;
            this.emitPlayerNoGold({})
        }

        this.changePlayerStatus({
            gold
        });

        let disGoldLabel = cc.find('Canvas/disGold/head/label').getComponent(cc.Label);
        disGoldLabel.string = GameData.gold;
    },

    changePlayerStatus(data) {
        if (this.node === undefined) {
            this.node = cc.find('Canvas/bg/player');
        }
            GameData.players[0].x = this.node.x = data.x;
            GameData.players[0].y = this.node.y = data.y;
            GameData.gold = this.node.gold = data.gold;
            GameData.players[0].scale = this.node.scale = data.scale;
            GameData.players[0].opacity = this.node.opacity = data.opacity;
            GameData.players[0].isLive = this.node.isLive = data.isLive;
            GameData.players[0].isInvin = this.node.isInvin = data.isInvin;
            GameData.players[0].invinTime = this.node.invinTime = data.invinTime;
            GameData.players[0].lastWidth = this.node.lastWidth = data.lastWidth;
            GameData.players[0].score = this.node.score = data.score;
    },

    /**
     * 机器人出生
     */
    robotBirth(datas,i) {
        if (datas.isRobot) {
            let position = this.getRandomPosition();
            let data = {
                userId: datas.userId,
                x: position.x,
                y: position.y,
                scale: 1,
                opacity: 255,
                isLive: 1,
                isInvin: 0,
                moveTimerNum:0,
                moveDistance: i == 1 ? this.robotMoveToDistance : this.robotMoveDistance
            };
            GameData.players[i].x = position.x;
            GameData.players[i].y = position.y;
            GameData.players[i].lastWidth = 40;
            GameData.players[i].scale = 1;
            GameData.players[i].moveTimerNum = data.moveTimerNum;
            GameData.players[i].moveDistance = data.moveDistance;
            cc.director.GlobalEvent.emit('othersBirth', {data});
        }
    },

    /**
     * 机器人移动
     */
    robotMove() {
     // var  x =   [GameData.players[i].x + GameData.players[i].moveDistance,GameData.players[i].x - GameData.players[i].moveDistance];
        for(var i = 0; i < GameData.players.length;i++) {
            if (GameData.players[i].isRobot) {
                GameData.players[i].moveTimerNum ++;
                if (GameData.players[i].moveTimerNum < 40) {
                    GameData.players[i].x =  GameData.players[i].x + GameData.players[i].moveDistance;
                    GameData.players[i].y = GameData.players[i].y + GameData.players[i].moveDistance;
                }
                if (GameData.players[i].moveTimerNum <80 && GameData.players[i].moveTimerNum >40) {
                    GameData.players[i].x =  GameData.players[i].x - GameData.players[i].moveDistance;
                    GameData.players[i].y =  GameData.players[i].y - GameData.players[i].moveDistance;
                }
                if (GameData.players[i].moveTimerNum > 80) {
                    GameData.players[i].moveTimerNum = 0;
                }
                let data = { userId: GameData.players[i].userId, x: GameData.players[i].x, y: GameData.players[i].y, isLive: 1 };
                // 每次更新位置判断边界碰撞
                if (!this.isContainsPoint(data.x,data.y,this.gameRect)) {
                    let position = this.getRandomPosition();
                    data.x = position.x;
                    data.y = position.y;
                    GameData.players[i].score = 0;
                    GameData.players[i].scale = 1;
                    var scoreData = {userId:data.userId,score:GameData.players[i].score};
                    cc.director.GlobalEvent.emit('playerScoreReset', scoreData);
                }
                cc.director.GlobalEvent.emit('otherMove', data);
            }

        }
    },

    /**
     * 机器人碰撞检测
     * @param other 机器人
     * @param self
     */
    robotCollision (other,self) {
        var index;
        var score;
        var otherUserID = other.node.userId;
        for(var i = 0; i < GameData.players.length;i++) {
            if (otherUserID === GameData.players[i].userId) {
                score = GameData.players[i].score;
                console.log("score", score);
                index = i;
            }
        }
        if (other.node.scale > self.node.scale) {
            //自己重生，给机器人变大加分
            this.playerBirth();
            var otherScript = cc.find('Canvas/bg').getComponent('Other');
            console.log("score1", score+GameData.players[0].score);
            otherScript.otherAddSize(otherUserID, score+GameData.players[0].score, index, other);
        } else {
            // 给自己加分变大，机器人重生
            let position = this.getRandomPosition();
            GameData.players[index].x = position.x;
            GameData.players[index].y = position.y;
            GameData.players[index].score = 0;
            GameData.players[index].scale = 1;
            var scoreData = {userId:GameData.players[index].userId,score:GameData.players[index].score}
            cc.director.GlobalEvent.emit('playerScoreReset', scoreData);
            GameData.players[0].score = GameData.players[0].score + score;
            console.log("score2",  GameData.players[0].score);
            this.playerAddSize( GameData.players[0].score );
            var selfscoreData = {userId:GameData.players[0],score:GameData.players[0].score}
            cc.director.GlobalEvent.emit('playerScoreChange', selfscoreData);
        }
    },

    emitPlayerBirth(data) {

    },

    emitPlayerMove(data) {
        cc.director.GlobalEvent.emit('playerMove', data)
    },

    emitPlayerDie(data) {
        cc.director.GlobalEvent.emit('playerDie', data)
    },

    emitPlayerNoGold(data) {
        cc.director.GlobalEvent.emit('playerNoGold', data)
    },

    /**
     * 返回一个出生的位置
     * @returns {{x: *, y: *}}
     */
    getRandomPosition() {
        let pad = 20
            , minX = -this.gameWidth / 2 + pad
            , minY = -this.gameHeight / 2 + pad
            , maxX = this.gameWidth / 2 - pad
            , maxY = this.gameHeight / 2 - pad;

        let x = utils.getRandom(minX, maxX);
        let y = utils.getRandom(minY, maxY);

        return {x, y}
    },

    /**
     * 判断是否碰撞边界
     * @param x
     * @param y
     * @param rect
     * @returns {boolean}
     */
    isContainsPoint(x, y, rect) {
        return cc.rectContainsPoint(rect, cc.p(x, y))
    },
    /**
     * 生成一个范围内的随机整数
     * @param min
     * @param max
     * @returns {*}
     */
    random(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
});
