var engine = require("../Lib/MatchvsEngine");
var response = require("../Lib/MatchvsDemoResponse");
var msg = require("../Lib/MatvhvsMessage");
let utils = require('../Util/index');
let Const = require('../Const/Const');
let config = require('../Global/config');
let GameData = require('../Global/GameData');

cc.Class({
    extends: cc.Component,

    properties: {
        starFoodList:[],
        // 引用星星预支资源
        starPrefab: {
            default: null,
            type: cc.Prefab
        },
    },

    onLoad() {
        let manager = cc.director.getCollisionManager();
        manager.enabled = true;
        this.mvsBind(this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        if (cc._renderType === cc.game.RENDER_TYPE_CANVAS) {
            cc.renderer.enableDirtyRegion(false);
        }
        this.foodPool = new cc.NodePool();
        let goldNode = cc.find('Canvas/disGold/head/label').getComponent(cc.Label);
        goldNode.string = GameData.gold;
        // 获取位置人物
        engine.prototype.sendEventEx(2,"getPosition")
        //像gameServer 请求星星数据。
        engine.prototype.sendEventEx(2, "getFont");
        this.countDown()
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
                let str = eventData.eventInfo.cpProto;
                if (str !== undefined) {
                    let array = str.split('|');
                    switch (array[0]) {
                        case "fond":
                            this.addFond(array[1]);
                            break;
                        case "figurePosition":

                            break;
                    }
                }
                break;
            case msg.MATCHVS_LEAVE_ROOM:
                this.halfOver();
                break;
        }
    },

    addFond(fondStr) {
        let fondMap = fondStr.split(",");
        var fondPostion = [];
        //所有的星星的位置数组
        let fondPostionMap = [];
        for (var i = 0; i < fondMap.length; i++) {
            fondPostion.push(fondMap[i]);
            if (fondPostion.length === 4) {
                fondPostionMap.push(fondPostion);
                fondPostion = [];
            }
        }
        for(var i = 0; i < fondPostionMap.length;i++) {
            var fond = fondPostionMap[i];
            this.addRandomFood(fond[0],fond[1],fond[2],fond[3]);
        }
    },

    objectPoolFactory(createObjFn) {
        var pool = [],
            create = function () {
                var obj = pool.length > 0 ? pool.shift() : createObjFn.apply(this, arguments);
                return obj;
            },
            recover = function (obj) {
                pool.push(obj);
            };
        return {
            create: create,
            recover: recover,
        };
    },
    /**
     * 游戏倒计时定时器
     */
    countDown() {
        let txtCountdown = cc.find('Canvas/txtCountdown').getComponent(cc.Label);
        // TODO: 可以直接在结束是clearInterval
        // TODO: 改写定时器的逻辑
        let timer = setInterval(() => {
            GameData.gameTime--;
            if (GameData.isInCoverView === true) {
                clearInterval(timer);
                return;
            }
            if (GameData.gameTime <= 0) {
                txtCountdown.string = '0s';
                clearInterval(timer);
                // 延迟1ms自动退出房间
                setTimeout(() => {
                    if (GameData.isHalfLeaveRoomBtnClick === false) {
                        GameData.leaveRoomStatus = 2;
                        let cpProto = "";
                        this.mvsLeaveRoom(cpProto);
                    }
                }, 1000);
            }

            if (GameData.gameTime === 120) {
                // if (GameData.gameTime === 170) {
                let userID = GameData.players[0].userID;
                for (let i = 0, l = GameData.players.length; i < l; i++) {
                    if (userID > GameData.players[i].userID) {
                        userID = GameData.players[i].userID;
                    }
                }
                // if (userID === Const.userID) {
                // console.error('userID ' + Const.userID + ': joinOver');
                this.mvsJoinOver();
                // }
            }

            txtCountdown.string = GameData.gameTime + 's';
        }, 1000);

        // for fix bug
        this.timer = timer;
    },

    loadFoodPrefab(callback) {
        cc.loader.loadRes("prefab/food", (err, res) => {
            if (err) {
                console.error('load food prefab error', err);
                return;
            }

            this.foodPrefab = res;
            callback && callback();
        })
    },

    // onEvent() {
    //     cc.director.GlobalEvent.off("otherAddFood").on('otherAddFood', (data) => {
    //         this.addFood(data.x, data.y, data.foodID, new cc.Color(data.colorArr[0], data.colorArr[1], data.colorArr[2]),
    //             data.score, data.scale, data.colorArr); }, this);
    //     cc.director.GlobalEvent.off('othersAddFoods').on('othersAddFoods', (data) => {
    //         // return;
    //         let tempArr = data.foodArr;
    //         tempArr = tempArr.filter(function (obj) {
    //             for (let i = 0, l = GameData.foodArr.length; i < l; i++) {
    //                 if (obj[2] === GameData.foodArr[i][2]) {
    //                     return false;
    //                 }
    //                 if (i === l - 1) {
    //                     return true;
    //                 }
    //             }
    //         });
    //         // 更新Gamedata.foodArr
    //         // utils.combineInto(foodArr, GameData.foodArr);
    //         GameData.foodArr = GameData.foodArr.concat(tempArr);
    //
    //         // 最多只有50个
    //         for (let i = 0, l = tempArr.length; i < l; i++) {
    //             let foodArrItem = tempArr[i];
    //             this.addFood(foodArrItem[0], foodArrItem[1], foodArrItem[2], cc.color(foodArrItem[3][0], foodArrItem[3][1], foodArrItem[3][2]),
    //                 foodArrItem[4], foodArrItem[5]);
    //         }
    //     }, this);
    //
    //     cc.director.GlobalEvent.off('otherEatAFood').on('otherEatAFood', (data) => {
    //         let node = undefined, foodID = data.foodID;
    //         let children = cc.find('Canvas/bg').children;
    //         for (let i = 0, l = children.length; i < l; i++) {
    //             let child = children[i];
    //             if (child.foodID && child.foodID === foodID) {
    //                 node = child;
    //                 break;
    //             }
    //         }
    //
    //         /**
    //          * 可能的原因:
    //          * 1.新用户加进来,并没有同步星星
    //          */
    //         if (node === undefined) {
    //             console.error('-------');
    //             console.error('foodID', foodID);
    //             console.error('node === undefined', node);
    //             console.error('-------');
    //             return;
    //         }
    //         let foodIDArr = foodID.split('f');
    //         if (foodIDArr[0] === String(Const.userID)) {
    //             GameData.foodCounter--;
    //         }
    //         let foodArrFilterResult = utils.foodArrFilter(GameData.foodArr, String(foodID));
    //         if (foodArrFilterResult.result) {
    //             this.foodPool.put(node);
    //             utils.foodArrSplice(GameData.foodArr, foodArrFilterResult.i);
    //             this.emitPlayerScoreChange(data);
    //         } else {
    //             console.warn('setTimeout eat the food,foodID:', foodID);
    //         }
    //
    //     }, this);

    // cc.director.GlobalEvent.off('playerBirth').on('playerBirth', (data) => {
    //
    // }, this);

    // cc.director.GlobalEvent.off('playerMove').on('playerMove', (data) => {
    //     data.event = Const.OTHER_MOVE_EVENT;
    //     let result = Mvs.engine.sendEvent(JSON.stringify(data));
    // }, this);
    //
    //     cc.director.GlobalEvent.off('playerEatAFood').on('playerEatAFood', (data) => {
    //         let node = data.food;
    //         let foodID = data.foodID;
    //         let foodIDArr = foodID.split('f');
    //
    //         if (foodIDArr[0] === String(Const.userID)) {
    //             GameData.foodCounter--;
    //         }
    //         let foodArrFilterResult = utils.foodArrFilter(GameData.foodArr, String(foodID));
    //         if (foodArrFilterResult.result) {
    //             this.foodPool.put(node);
    //             utils.foodArrSplice(GameData.foodArr, foodArrFilterResult.i);
    //             this.emitPlayerScoreChange(data);
    //             data.food = null;
    //             data.event = Const.OTHER_EAT_A_FOOD_EVENT;
    //             let result = Mvs.engine.sendEvent(JSON.stringify(data));
    //         } else {
    //             console.error('i can not eat the food, foodID:' + foodID);
    //             console.error('GameData.foodArr', GameData.foodArr);
    //         }
    //     }, this);
    //
    //     cc.director.GlobalEvent.off('playerDie').on('playerDie', (data) => {
    //         data.event = Const.OTHER_DIE_EVENT;
    //         let result = Mvs.engine.sendEvent(JSON.stringify(data));
    //         this.emitPlayerScoreReset({ userID: data.userID, score: 0  });
    //         this.emitPlayerScoreChange({ userID: data.oUserID , score: data.score });
    //         this.showDeathWaitDisplayer();
    //         let timer = setTimeout(() => {
    //             if (GameData.isGameOver) {
    //                 clearTimeout(timer);
    //                 return;
    //             }
    //             let pos = this.getRandomPosition(), x = pos.x, y = pos.y;
    //             this.emitPlayerVivid({x, y});
    //             let result = Mvs.engine.sendEvent(JSON.stringify({event: Const.OTHER_VIVID_EVENT, userID: data.userID,
    //                 x, y, scale: 1, opacity: 178, isLive: 1, isInvin: 1}))
    //         }, 3000);
    //     }, this)
    // },


    mvsUnBind() {
        //     Mvs.response.sendEventNotify = null;
        //     Mvs.response.leaveRoomResponse = null;
        //     Mvs.response.joinOverResponse = null;
        //     Mvs.response.leaveRoomNotify = null;
        //     Mvs.response.sendEventResponse = null;
        //     Mvs.response.errorResponse = null;
        //     Mvs.response.networkStateNotify = null;
    },

    mvsSendEventResponse(rsp) {
        if (rsp.status === 200) {
            // console.log('response sentEvent ok', rsp);
        } else {
            console.error('response sentEvent error', rsp);
        }
    },

    mvsErrorResponse(code, errMsg) {
        console.error('errorResponse', arguments);

        // TODO: 测试困难
        // 异常退出,到cover界面,cover界面中由想正常运行

        // 只处理code = 1001 的情况
        // ??? code = 1001 && errMsg === "gateway disconnect"
        if (code === 1001) {
            GameData.isServerErrorCode1000 = true;

            this.foodPool.clear();
            this.node.stopAllActions();

            // this.showPromptOfError('网络异常 5秒后将退出游戏');
            this.mvsUnBind();
            this.resetSomeGameData();

            this.showPromptOfError('你已掉线 请刷新 重开');

            // GameData.isInCoverView = true;
            //
            // setTimeout(() => {
            //     cc.director.loadScene('cover');
            // }, 5000)
        }

    },

    mvsNetworkStateNotify(notifyData) {
        let data = {
            userID: notifyData.userID,
            state: notifyData.state,
            roomId: notifyData.roomID,
            ownerId: notifyData.owner,
        };
        if (data.state === 1) {
            this.showPrompt('有玩家掉线 自动踢掉');
            this.removePlayer(data);
        }
    },

    mvsJoinOverResponse(rsp) {
        console.log('mvsJoinOverResponse', rsp);
    },

    mvsSentEventNotify(info) {
        if (!info || !info.cpProto) {
            console.error('sendEventNotify info and info.cpProto require', info);
            return;
        }
        let data = JSON.parse(info.cpProto);
        if (data.toUserId === Const.userID) {
            if (data.event === Const.OTHERS_BIRTH_EVENT) {
                // 分数同步
                cc.director.GlobalEvent.emit('playerScoreChange', {
                    userID: data.data.userID,
                    score: data.data.score
                })
                cc.director.GlobalEvent.emit('othersBirth', data);
            }
            if (data.event === Const.OTHERS_ADD_FOODS_EVENT) {
                cc.director.GlobalEvent.emit('othersAddFoods', data);
            }
        }


        if (data.event === Const.CAN_I_BE_EATEN) {
            if (data.eatUserID === Const.userID) {
                cc.director.GlobalEvent.emit('canYouBeEaten', data);
            }
        }

        if (data.event === Const.YOU_CAN_BE_EATEN) {
            if (data.beEatUserID === Const.userID) {
                cc.director.GlobalEvent.emit('iCanBeEaten', data);
            }
        }

        if (data.event === Const.OTHER_NEW_FOOD_EVENT) {
            cc.director.GlobalEvent.emit('otherAddFood', data);
        }

        if (data.event === Const.OTHER_EAT_A_FOOD_EVENT) {
            cc.director.GlobalEvent.emit('otherEatAFood', data);
        }

        if (data.event === Const.OTHER_BIRTH_EVENT) {
            cc.director.GlobalEvent.emit('otherBirth', data);
        }

        if (data.event === Const.OTHER_MOVE_EVENT) {
            cc.director.GlobalEvent.emit('otherMove', data);
        }

        if (data.event === Const.OTHER_DIE_EVENT) {
            cc.director.GlobalEvent.emit('otherDie', data);
            if (data.oeo && data.oeo === true) {
                cc.director.GlobalEvent.emit('otherEatOther', data);
            }
        }

        if (data.event === Const.OTHER_VIVID_EVENT) {
            cc.director.GlobalEvent.emit('otherVivid', data)
        }

        if (data.event === Const.OTHER_CHANGE_SIZE_EVENT) {
            cc.director.GlobalEvent.emit('otherChangeSize', data)
        }
    },

    /**
     * 增加星星
     * @param x x坐标
     * @param y y坐标
     * @param foodID 食物ID
     * @param score 分数
     */
    addRandomFood(x,y,foodID,score) {
        let colorArr = utils.getRandomColor(), scale,color = new cc.Color(colorArr[0], colorArr[1], colorArr[2]);
        var newStar = "undefined";
        for(var i = 0; i < this.starFoodList.length;i++) {
            if (foodID === this.starFoodList[i].foodID) {
                newStar = this.starFoodList[i];
                break;
            }
        }
        if (newStar === "undefined") {
            newStar = cc.instantiate(this.starPrefab);
            this.starFoodList.push(newStar);
            this.node.addChild(newStar)
        }
        newStar.setPosition(cc.v2(x ,y));
        newStar.color = color;
        if (score === 60) {
            scale = 2;
        } else if (score === 40) {
            scale = 1.3;
        } else if (score === 20) {
            scale = 0.5;
        }
        newStar.scale = scale;
        newStar.active = true;
    },

    emitPlayerVivid(data) {
        cc.director.GlobalEvent.emit('playerVivid', data)
    },

    emitPlayerScoreChange(data) {
        if (data.food) {
            data.food = ''
        }
        cc.director.GlobalEvent.emit('playerScoreChange', data)
    },

    emitPlayerScoreReset(data) {
        cc.director.GlobalEvent.emit('playerScoreReset', data)
    },

    gameOver() {
        let disDeathWait = cc.find('Canvas/disDeathWait');
        disDeathWait.active = false;
        this.foodPool.clear();
        this.node.stopAllActions();
        let score = GameData.players[0].score, gold = score / 2, rank = 0;
        let nodes = cc.find('Canvas/disScore/scoreList').children;
        for (let i = 0, l = nodes.length; i < l; i++) {
            if (GameData.players[0].userID === nodes[i].userID) {
                rank = i + 1;
                break
            }
        }
        if (rank === 0) {
            console.warn('rank error, rank = 0');
            return;
        }
        this.showDisGOver(score, gold, rank);
        this.updateDatabase(gold, rank)
    },

    halfOver() {
        this.foodPool.clear();
        this.node.stopAllActions();
        GameData.isGameStart = false;
        GameData.isGameOver = true;
        this.mvsUnBind();
        this.resetSomeGameData();
        try {
            wx.offHide(this.onHideHandler.bind(this))
        } catch (e) {
            cc.game.off(cc.game.EVENT_HIDE);
        }
        this.showPromptOfError('正在加载 请稍后');
        cc.director.loadScene('lobby', () => {
            this && this.hidePromptError && this.hidePromptError();
        });
    },

    // getRandomPosition() {
    //     let pad = 40 , minX = -this.width / 2 + pad , minY = -this.height / 2 + pad ,maxX = this.width / 2 - pad ,maxY = this.height / 2 - pad;
    //     let x = utils.getRandom(minX, maxX) , y = utils.getRandom(minY, maxY);
    //     return {x, y}
    // },

    showDeathWaitDisplayer() {
        let disDeathWait = cc.find('Canvas/disDeathWait');
        disDeathWait.active = true;
        let counter = 3;
        let txtTime = disDeathWait.getChildByName('txtTime').getComponent(cc.Label);
        txtTime.string = '复活倒计时:' + counter + 's';
        let timer = setInterval(() => {
            if (counter === 0) {
                disDeathWait.active = false;
                clearInterval(timer)
            }
            if (counter > 0) {
                counter--;
                txtTime.string = '复活倒计时:' + counter + 's'
            }
        }, 1000);
    },


    showDisGOver(score, gold, rank) {
        let disGOver = cc.find('Canvas/disGOver');
        disGOver.zIndex = 999;
        disGOver.active = true;
        let boxScoreValue = cc.find('Canvas/disGOver/boxScore/value')
            , scoreLabel = boxScoreValue.getComponent(cc.Label);
        scoreLabel.string = score;
        let boxScoreGold = cc.find('Canvas/disGOver/boxGold/value')
            , goldLabel = boxScoreGold.getComponent(cc.Label);
        goldLabel.string = gold;
        let boxScoreRank = cc.find('Canvas/disGOver/boxRank/value')
            , rankLabel = boxScoreRank.getComponent(cc.Label);
        rankLabel.string = rank;
    },

    updateDatabase(gold, rank) {
        GameData.gold += gold;
        GameData.allValue += 1;
        if (rank === 1) {
            GameData.winValue += 1;
        }
    },

    backBtnHandler() {
        this.mvsUnBind();
        this.cleanBgAllChildren();
        this.resetSomeGameData();
        try {
            wx.offHide(this.onHideHandler.bind(this))
        } catch (e) {
            cc.game.off(cc.game.EVENT_HIDE);
        }

        this.hidePromptError();
        cc.director.loadScene('lobby', () => {
            this && this.hidePromptError && this.hidePromptError();
        });
        // GameData.leaveRoomStatus = 2;
        // this.mvsLeaveRoom();
    },

    mvsJoinOver() {
        let result = Mvs.engine.joinOver("");
        if (result === 0) {
            console.warn('sdk joinOver ok', result);
        } else {
            console.error('sdk joinOver error', result);
        }
    },

    mvsLeaveRoom(cpProto) {
        let result = engine.prototype.leaveRoom(cpProto);
        if (result === 0) {
            console.log('sdk half leaveRoom ok', result);
        } else {
            console.error('sdk half leaveRoom error', result);
            this.showPromptOfError('离开房间[sdk]失败');
            return;
        }
    },

    mvsLeaveRoomResponse(rsp) {
        if (rsp.status === 200) {
            this.gameOver();
        } else {
            console.error('response half leaveRoom error', rsp);
            this.showPromptOfError('离开房间失败');
            return;
        }
        clearInterval(this.timer);
        this.halfOver();
    },

    settingBtnHandler() {
        let halfLeaveBtn = cc.find('Canvas/btnHalfLeave');
        halfLeaveBtn.active = true;

        setTimeout(() => {
            // this.hideHalfLeaveBtn();
            halfLeaveBtn.active = false;
        }, 1000)
    },


    hideHalfLeaveBtn() {
        let halfLeaveBtn = cc.find('Canvas/btnHalfLeave');
        halfLeaveBtn.active = false;
    },

    halfLeaveBtnHandler() {
        let cpProto = Const.OTHER_HALF_LEAVE_EVENT;
        this.mvsLeaveRoom(cpProto);
    },

    // 其他玩家中途退出游戏
    mvsLeaveRoomNotify(roomInfo) {
        if (roomInfo.cpProto === Const.OTHER_HALF_LEAVE_EVENT) {
            this.removePlayer(roomInfo);
        }
    },

    showPromptOfError(str) {
        let promptNode = cc.find('Canvas/prompt');
        let promptTxt = promptNode.getChildByName('label').getComponent(cc.Label);
        promptTxt.string = str;
        promptNode.active = true;
    },

    hidePromptError() {
        let promptNode = cc.find('Canvas/prompt');
        promptNode.active = false;
    },

    showPrompt(str) {
        let promptNode = cc.find('Canvas/prompt');
        let promptTxt = promptNode.getChildByName('label').getComponent(cc.Label);
        promptTxt.string = str;
        promptNode.active = true;
        promptNode.opacity = 255;
        setTimeout(() => {
            let action = cc.fadeOut(5.0);
            promptNode.runAction(action);
            promptNode.active = false;
        }, 1000);
    },


    hidePlayer(data) {
        cc.director.GlobalEvent.emit('hideOther', {userID: data.userID});
    },

    removePlayer(data) {
        let leaveUserId = data.userID; // 离开者id
        let k = 0;
        for (let i = 0, l = GameData.players.length; i < l; i++) {
            if (leaveUserId === GameData.players[i].userID) {
                k = i;
                break
            }
        }
        GameData.players.splice(k, 1);
        let _data = {
            userID: leaveUserId
        };
        // 删除节点, 去掉分数排行
        cc.director.GlobalEvent.emit('otherDieOfLeaveRoom', _data);
        cc.director.GlobalEvent.emit('removeScoreItemOfLeaveRoom', _data);
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
        GameData.halfLeaveRoomStatus = 1;
        GameData.isUserInTheRoom = false;
    },
});
