let Mvs = require('../Lib/Mvs');
let utils = require('../Util/index');
let Const = require('../Const/Const');
let config = require('../Global/config');
let GameData = require('../Global/GameData');

cc.Class({
    extends: cc.Component,

    onLoad() {
        let manager = cc.director.getCollisionManager();
        manager.enabled = true;

        if (cc._renderType === cc.game.RENDER_TYPE_CANVAS) {
            cc.renderer.enableDirtyRegion(false);
        }

        this.ADD_FOOD_DT = config.ADD_FOOD_DT;
        this.MAX_FOOD_COUNT = config.MAX_FOOD_COUNT;

        this.width = this.node.width;
        this.height = this.node.height;

        this.foodPool = new cc.NodePool();

        this.foodPrefab = undefined;

        this.onEvent();
        this.mvsBind();
    },

    start() {
        if (GameData.isGameStart === false) {
            return;
        }

        let goldNode = cc.find('Canvas/disGold/head/label').getComponent(cc.Label);
        goldNode.string = GameData.gold;

        let time = 500;
        if (GameData.isHasChangeOtherScore) {
            time = 2000;
        }
        setTimeout(() => {
            this.loadFoodPrefab(this.addRandomFood.bind(this));
        }, time);

        this.countDown()
    },

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

            // if (GameData.halfLeaveRoomStatus === 6) {
            //     clearInterval(timer);
            //     return;
            // }

            if (GameData.gameTime <= 0) {
                txtCountdown.string = '0s';
                clearInterval(timer);
                
                // 延迟1ms自动退出房间
                setTimeout(() => {
                    if (GameData.isHalfLeaveRoomBtnClick === false) {
                        GameData.leaveRoomStatus = 2;
                        let cpProto = "";
                        this.mvsLeaveRoom(cpProto);

                        // this.gameOver();
                    }
                }, 1000);
            }

            if (GameData.gameTime === 120) {
                // if (GameData.gameTime === 170) {
                let userId = GameData.players[0].userId;
                for (let i = 0, l = GameData.players.length; i < l; i++) {
                    if (userId > GameData.players[i].userId) {
                        userId = GameData.players[i].userId;
                    }
                }
                // if (userId === Const.userId) {
                // console.error('userId ' + Const.userId + ': joinOver');
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

    onEvent() {
        cc.director.GlobalEvent.off("otherAddFood").on('otherAddFood', (data) => {
            let x = data.x
                , y = data.y
                , foodId = data.foodId
                // , color = data.color
                , color = new cc.Color(data.colorArr[0], data.colorArr[1], data.colorArr[2])
                , score = data.score
                , scale = data.scale // food scale
                , colorArr = data.colorArr;

            this.addFood(x, y, foodId, color, score, scale, colorArr);
        }, this);

        cc.director.GlobalEvent.off('othersAddFoods').on('othersAddFoods', (data) => {
            // return;
            let tempArr = data.foodArr;
            tempArr = tempArr.filter(function (obj) {
                for (let i = 0, l = GameData.foodArr.length; i < l; i++) {
                    if (obj[2] === GameData.foodArr[i][2]) {
                        return false;
                    }
                    if (i === l - 1) {
                        return true;
                    }
                }
            })
            // 更新Gamedata.foodArr
            // utils.combineInto(foodArr, GameData.foodArr);
            GameData.foodArr = GameData.foodArr.concat(tempArr);

            // 最多只有50个
            for (let i = 0, l = tempArr.length; i < l; i++) {
                let foodArrItem = tempArr[i];
                // console.error('foodArrItem.colorArr', foodArrItem.colorArr);
                // let x = foodArrItem.x
                //     , y = foodArrItem.y
                //     , foodId = foodArrItem.foodId
                //     , color = cc.color(foodArrItem.colorArr[0], foodArrItem.colorArr[1], foodArrItem.colorArr[2])
                //     , score = foodArrItem.score
                //     , scale = foodArrItem.scale;
                let x = foodArrItem[0]
                    , y = foodArrItem[1]
                    , foodId = foodArrItem[2]
                    , color = cc.color(foodArrItem[3][0], foodArrItem[3][1], foodArrItem[3][2])
                    , score = foodArrItem[4]
                    , scale = foodArrItem[5];

                this.addFood(x, y, foodId, color, score, scale);
            }
        }, this);

        cc.director.GlobalEvent.off('otherEatAFood').on('otherEatAFood', (data) => {
            let node = undefined
                , foodId = data.foodId;

            let children = cc.find('Canvas/bg').children;

            for (let i = 0, l = children.length; i < l; i++) {
                let child = children[i];
                if (child.foodId && child.foodId === foodId) {
                    node = child;
                    break
                }
            }

            /**
             * 可能的原因:
             * 1.新用户加进来,并没有同步星星
             */
            if (node === undefined) {
                console.error('-------');
                console.error('foodId', foodId);
                console.error('node === undefined', node);
                console.error('-------');
                return;
            }

            // console.warn('----------');
            // console.warn('other eat a food');
            // console.warn('foodId', foodId);
            // console.warn('----------');
            // console.warn('');

            let foodIdArr = foodId.split('f');
            if (foodIdArr[0] === String(Const.userId)) {
                GameData.foodCounter--;
            }


            // function foodIdArrFilter(arr, foodId) {
            //     for (let i = 0, l = arr.length; i < l; i++) {
            //         if (arr[i].foodId === foodId) {
            //             return {result: true, i: i};
            //         }
            //         if (i === l - 1) {
            //             return {result: false};
            //         }
            //     }
            // }
            //
            // function foodIdArrSplice(arr, i) {
            //     arr.splice(i, 1);
            // }

            // for (let i = 0, l = GameData.foodArr.length; i < l; i++) {
            //     if (GameData.foodArr[i].foodId === foodId) {
            //         return {result: true, i: i};
            //     }
            //     if (i === l - 1) {
            //         return {result: false};
            //     }
            // }

            // if (GameData.foodArr.includes(String(foodId))) {
            //     this.foodPool.put(node);
            //     GameData.foodArr.splice(GameData.foodArr.indexOf(String(foodId)), 1);
            //     this.emitPlayerScoreChange(data);
            // } else {
            //     console.warn('setTimeout eat the food,foodId:', foodId);
            //
            //     setTimeout(() => {
            //         this.foodPool.put(node);
            //         GameData.foodArr.splice(GameData.foodArr.indexOf(String(foodId)), 1);
            //         this.emitPlayerScoreChange(data);
            //     }, 200)
            // }

            let foodArrFilterResult = utils.foodArrFilter(GameData.foodArr, String(foodId));

            if (foodArrFilterResult.result) {
                this.foodPool.put(node);
                utils.foodArrSplice(GameData.foodArr, foodArrFilterResult.i);
                this.emitPlayerScoreChange(data);
            } else {
                console.warn('setTimeout eat the food,foodId:', foodId);

                // setTimeout(() => {
                //     this.foodPool.put(node);
                //     foodIdArrSplice(GameData.foodArr, foodIdArrFilterResult.i);
                //     this.emitPlayerScoreChange(data);
                // }, 200)
            }

        }, this);

        cc.director.GlobalEvent.off('playerBirth').on('playerBirth', (data) => {
            data.event = Const.OTHER_BIRTH_EVENT;
            let result = Mvs.engine.sendEvent(JSON.stringify(data));
        }, this);

        cc.director.GlobalEvent.off('playerMove').on('playerMove', (data) => {
            data.event = Const.OTHER_MOVE_EVENT;
            let result = Mvs.engine.sendEvent(JSON.stringify(data));
        }, this);

        cc.director.GlobalEvent.off('playerEatAFood').on('playerEatAFood', (data) => {
            let node = data.food;
            let foodId = data.foodId;
            let foodIdArr = foodId.split('f');

            if (foodIdArr[0] === String(Const.userId)) {
                GameData.foodCounter--;
            }

            // function foodIdArrFilter(arr, foodId) {
            //     for (let i = 0, l = arr.length; i < l; i++) {
            //         if (arr[i].foodId === foodId) {
            //             return {result: true, i: i};
            //         }
            //         if (i === l - 1) {
            //             return {result: false};
            //         }
            //     }
            // }
            //
            // function foodIdArrSplice(arr, i) {
            //     console.log('foodIdArrSplice', arr[i]);
            //     arr.splice(i, 1);
            // }

            // if (GameData.foodArr.includes(String(foodId))) {
            //     // this.foodPool.resize(200);
            //     this.foodPool.put(node);
            //     GameData.foodArr.splice(GameData.foodArr.indexOf(String(foodId)), 1);
            //
            //     this.emitPlayerScoreChange(data);
            //
            //     // 这个操作必须做,理由: JSON.stringify
            //     data.food = null;
            //     data.event = Const.OTHER_EAT_A_FOOD_EVENT;
            //     let result = Mvs.engine.sendEvent(JSON.stringify(data));
            //
            // } else {
            //     console.error('i can not eat the food, foodId:' + foodId);
            //     console.error('GameData.foodArr', GameData.foodArr);
            // }
            let foodArrFilterResult = utils.foodArrFilter(GameData.foodArr, String(foodId));

            if (foodArrFilterResult.result) {
                this.foodPool.put(node);
                utils.foodArrSplice(GameData.foodArr, foodArrFilterResult.i);

                this.emitPlayerScoreChange(data);
                data.food = null;
                data.event = Const.OTHER_EAT_A_FOOD_EVENT;
                let result = Mvs.engine.sendEvent(JSON.stringify(data));
            } else {
                console.error('i can not eat the food, foodId:' + foodId);
                console.error('GameData.foodArr', GameData.foodArr);
            }
        }, this);

        cc.director.GlobalEvent.off('playerDie').on('playerDie', (data) => {
            data.event = Const.OTHER_DIE_EVENT;
            let result = Mvs.engine.sendEvent(JSON.stringify(data));

            let data1 = {
                userId: data.userId,
                score: 0
            };
            this.emitPlayerScoreReset(data1);

            let data2 = {
                userId: data.oUserId,// other player userid
                score: data.score
            };
            this.emitPlayerScoreChange(data2);

            this.showDeathWaitDisplayer();

            let timer = setTimeout(() => {
                if (GameData.isGameOver) {
                    clearTimeout(timer);
                    return;
                }

                let pos = this.getRandomPosition()
                    , x = pos.x
                    , y = pos.y;

                this.emitPlayerVivid({ x, y });

                let data2 = {
                    event: Const.OTHER_VIVID_EVENT,
                    userId: data.userId,
                    x,
                    y,
                    scale: 1,
                    // opacity: 255,
                    opacity: 178,
                    isLive: 1,
                    isInvin: 1
                };

                let result = Mvs.engine.sendEvent(JSON.stringify(data2))
            }, 3000);
        }, this)
    },

    mvsBind() {
        Mvs.response.sendEventNotify = this.mvsSentEventNotify.bind(this);
        Mvs.response.leaveRoomResponse = this.mvsLeaveRoomResponse.bind(this);
        Mvs.response.joinOverResponse = this.mvsJoinOverResponse.bind(this);
        Mvs.response.leaveRoomNotify = this.mvsLeaveRoomNotify.bind(this);

        Mvs.response.sendEventResponse = this.mvsSendEventResponse.bind(this);

        Mvs.response.errorResponse = this.mvsErrorResponse.bind(this);
        Mvs.response.networkStateNotify = this.mvsNetworkStateNotify.bind(this);

    },

    mvsUnBind() {
        Mvs.response.sendEventNotify = null;
        Mvs.response.leaveRoomResponse = null;
        Mvs.response.joinOverResponse = null;
        Mvs.response.leaveRoomNotify = null;

        Mvs.response.sendEventResponse = null;

        Mvs.response.errorResponse = null;
        Mvs.response.networkStateNotify = null;
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
            userId: notifyData.userID,
            state: notifyData.state,
            roomId: notifyData.roomID,
            ownerId: notifyData.owner,
        };

        // console.log('mvsNetworkStateNotify', data);

        // 在游戏中,如果出现异常,不踢人,该玩家应该会自动离开
        if (data.state === 1) {
            // 有玩家掉线 正在重连
            // this.showPrompt('有玩家掉线 正在重连');
            this.showPrompt('有玩家掉线 自动踢掉');

            // this.hidePlayer(data);
            this.removePlayer(data);
        }

        // else if (data.state === 3) {
        //     // 有玩家掉线 重连失败 已退出游戏
        //     this.showPrompt('有玩家掉线 重连失败 已退出游戏');
        //     this.removePlayer(data);
        // }
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

        if (data.isGameStart === true && data.toUserId === Const.userId) {
            if (data.event === Const.OTHERS_BIRTH_EVENT) {
                cc.director.GlobalEvent.emit('othersBirth', data);
            }

            if (data.event === Const.OTHERS_ADD_FOODS_EVENT) {
                cc.director.GlobalEvent.emit('othersAddFoods', data);
            }
        }


        if (data.event === Const.CAN_I_BE_EATEN) {
            if (data.eatUserId === Const.userId) {
                cc.director.GlobalEvent.emit('canYouBeEaten', data);
            }
        }

        if (data.event === Const.YOU_CAN_BE_EATEN) {
            if (data.beEatUserId === Const.userId) {
                cc.director.GlobalEvent.emit('iCanBeEaten', data);
            }
        }

        if (data.event === Const.OTHER_NEW_FOOD_EVENT) {
            // data.color在传输过程中,可能会被处理
            // 详细细节查看下,传输前后
            // data.color = new cc.Color(data.colorArr[0], data.colorArr[1], data.colorArr[2]);
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

    addRandomFood() {
        let action = cc.repeatForever(cc.sequence(
            cc.callFunc(() => {
                if (GameData.foodCounter >= this.MAX_FOOD_COUNT) {
                    return
                }
                let foodId = Const.userId + 'f' + GameData.foodIdCounter;
                GameData.foodCounter++;
                GameData.foodIdCounter++;

                let pos = this.getRandomPosition()
                    , x = pos.x
                    , y = pos.y;

                let colorArr = utils.getRandomColor()
                    , color = new cc.Color(colorArr[0], colorArr[1], colorArr[2])
                    , score = utils.getRandomScore();

                let scale = Math.random().toFixed(2);
                if (scale < 0.5) {
                    scale = 0.5
                }

                this.addFood(x, y, foodId, color, score, scale, colorArr);

                let data = {
                    event: Const.OTHER_NEW_FOOD_EVENT,
                    x,
                    y,
                    foodId,
                    color,
                    colorArr,
                    score,
                    scale
                };
                let result = Mvs.engine.sendEvent(JSON.stringify(data));

            }, this),
            cc.delayTime(this.ADD_FOOD_DT)
        ));

        this.node.runAction(action)
    },

    addFood(x, y, foodId, color, score, scale, colorArr) {
        if (this.foodPrefab === undefined) {
            cc.loader.loadRes("prefab/food", (err, res) => {
                if (err) {
                    console.error('load food prefab error', err);
                    return;
                }
                this.foodPrefab = res;

                this._addFood(x, y, foodId, color, score, scale, colorArr);
            });
        }

        else {
            this._addFood(x, y, foodId, color, score, scale, colorArr);
        }

        // 在othersAddFoods的时候不需要
        if (!!colorArr) {
            // GameData.foodArr.push({
            //     x: x,
            //     y: y,
            //     foodId: String(foodId),
            //     colorArr: colorArr,
            //     score: score,
            //     scale: scale
            // });
            GameData.foodArr.push([x, y, foodId, colorArr, score, scale])
            // console.log('GameData.foodArr', GameData.foodArr);
            // console.error("_addFood", {
            //     x: x,
            //     y: y,
            //     foodId: String(foodId),
            //     colorArr: colorArr,
            //     score: score,
            //     scale: scale
            // });
        }
    },

    _addFood(x, y, foodId, color, score, scale, colorArr) {
        let node;

        if (this.foodPool.size() > 0) {
            // this.foodPool.resize(200);
            node = this.foodPool.get()
        } else {
            node = cc.instantiate(this.foodPrefab)
        }

        try {
            node.x = x;
            node.y = y;
            node.foodId = foodId;
            node.color = color;
            node.score = score;
            node.scale = scale;

            node.parent = this.node;

            // 更新foodIdArr
            // GameData.foodArr.push(String(foodId));

        } catch (e) {
        }
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

        GameData.isGameStart = false;
        GameData.isGameOver = true;

        let score = GameData.players[0].score
            , gold = score / 2
            , rank = 0;


        let nodes = cc.find('Canvas/disScore/scoreList').children;

        for (let i = 0, l = nodes.length; i < l; i++) {
            if (GameData.players[0].userId === nodes[i].userId) {
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
        this.cleanBgAllChildren();
        this.resetSomeGameData();

        cc.director.loadScene('lobby');
    },

    getRandomPosition() {
        let pad = 40
            , minX = -this.width / 2 + pad
            , minY = -this.height / 2 + pad
            , maxX = this.width / 2 - pad
            , maxY = this.height / 2 - pad;

        let x = utils.getRandom(minX, maxX)
            , y = utils.getRandom(minY, maxY);

        return { x, y }
    },

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
        // bug
        /*if (GameData.leaveRoomStatus === 2 || GameData.leaveRoomStatus === 5) {
            console.warn('sdk leaveRooming or waiting response');
            console.warn('GameData.leaveRoomStatus', GameData.leaveRoomStatus);
            return;
        }*/

        this.mvsUnBind();
        this.cleanBgAllChildren();
        this.resetSomeGameData();

        cc.director.loadScene('lobby');
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
        if (GameData.isHalfLeaveRoomBtnClick === true) {
            let result = Mvs.engine.leaveRoom(cpProto);

            if (result === 0) {
                GameData.halfLeaveRoomStatus = 3;
                console.log('sdk half leaveRoom ok', result);
            } else {
                GameData.halfLeaveRoomStatus = 4;
                console.error('sdk half leaveRoom error', result);
                return;
            }

            GameData.halfLeaveRoomStatus = 5;
        } else {
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
        }

    },

    mvsLeaveRoomResponse(rsp) {
        if (GameData.isHalfLeaveRoomBtnClick === true) {
            if (rsp.status === 200) {
                GameData.halfLeaveRoomStatus = 6;
                console.log('response half leaveRoom ok', rsp);
            }
            else {
                GameData.halfLeaveRoomStatus = 7;
                console.error('response half leaveRoom error', rsp);
                return;
            }

            clearInterval(this.timer);

            this.halfOver();
        }

        else {
            if (rsp.status === 200) {
                GameData.leaveRoomStatus = 6;
                console.log('response leaveRoom ok', rsp);
            } else {
                GameData.leaveRoomStatus = 7;
                console.error('response leaveRoom error', rsp);
                return;
            }

            this.gameOver();
        }

        // this.resetSomeGameData();
        // cc.director.loadScene('lobby');
    },

    settingBtnHandler() {
        if (GameData.isServerErrorCode1000) {
            return;
        }

        this.showHalfLeaveBtn();
    },

    showHalfLeaveBtn() {
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
        if (GameData.isHalfLeaveRoomBtnClick === true) {
            return;
        }

        GameData.isHalfLeaveRoomBtnClick = true;

        if (GameData.halfLeaveRoomStatus === 2 || GameData.halfLeaveRoomStatus === 5) {
            console.warn('sdk half leaveRooming or waiting response');
        }

        GameData.halfLeaveRoomStatus = 2;

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

    showPrompt(str) {
        if (GameData.isGameStart === true && GameData.isGameOver === false) {
            let promptNode = cc.find('Canvas/prompt');
            let promptTxt = promptNode.getChildByName('label').getComponent(cc.Label);
            promptTxt.string = str;

            promptNode.active = true;
            promptNode.opacity = 255;

            setTimeout(() => {
                if (GameData.isGameStart === true && GameData.isGameOver === false) {
                    let action = cc.fadeOut(5.0);
                    promptNode.runAction(action);
                    promptNode.active = false;
                }
            }, 1000);
        }
    },

    cleanBgAllChildren() {
        // try {
        //     let foo = this.node.x;
        // } catch(e) {
        //     this.node = cc.find('Canvas/bg');
        // }

        // this.node.removeAllChildren(false);
    },

    hidePlayer(data) {
        let hideUserId = data.userId;

        let _data = {
            userId: hideUserId
        };

        cc.director.GlobalEvent.emit('hideOther', _data);
    },

    removePlayer(data) {
        let leaveUserId = data.userId; // 离开者id

        let k = 0;

        for (let i = 0, l = GameData.players.length; i < l; i++) {
            if (leaveUserId === GameData.players[i].userId) {
                k = i;
                break
            }
        }
        GameData.players.splice(k, 1);

        let _data = {
            userId: leaveUserId
        };
        // 删除节点, 去掉分数排行
        cc.director.GlobalEvent.emit('otherDieOfLeaveRoom', _data);
        cc.director.GlobalEvent.emit('removeScoreItemOfLeaveRoom', _data);
    },

    // user重连

    // user重连成功

    // user重连失败

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

        // for僵尸进程
        GameData.isUserInTheRoom = false;
    },
});
