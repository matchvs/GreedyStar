module.exports = {
    // me
    gold: 100,
    allValue: 0,
    winValue: 0,

    angle: null,
    //正常的速度
    speed1: 0,
    //加速按钮的速度
    speed2: 0,
    foodCounter: 0,
    foodIDCounter: 0,
    foodArr: [],

    // room
    players: [
    ],
    roomID: 0,
    ownerID: 0,
    isOwner: false,

    // game status
    isGameStart: false,
    isGameOver: false,
    isGameWin: false,
    gameTime: 180,


    leaveRoomStatus: 1,
    halfLeaveRoomStatus: 1,

    // for response
    gameStartEventSequence: 0,


    //
    isInRoomView: false,
    isQuickJoinBtnClick: false,
    isCreateRoomBtnClick: false,
    isJoinRoomBtn1Click: false,
    isJoinRoomBtn2Click: false,
    isRoomItemClick: false,

    canLeaveRoom: true,
    gameStartCountdownValue: 10,
    isGameStartCountdowning: false,
    isHasChangeOtherScore: false,
    isHasOthersAddFoods: false,

    // isLeaveRoomBtn2Click: false,
    isHalfLeaveRoomBtnClick: false,
    isShowUserProfileLayer: false,
    isShowJoinRoomLayer: false,

    // server error
    isServerErrorCode1000: false, // errorResponse code: 1000 断线

    // 僵尸进程的处理
    isUserInTheRoom: false,


    //
    dieDataBuffer: null,


    //5秒时间房间无真人就加入机器人。
    isRoomNumTime :30000,
    robotIDs:[99999,88888],

    //是否是独立部署
    isPremiseInit : false,

    //是否获取到了用户微信头像
    isWxAvatar : false
};
