module.exports = {
    // me
    gold: 100,
    allValue: 0,
    winValue: 0,

    angle: 0,
    //正常的速度
    speed1: 0,
    //加速按钮的速度
    speed2: 0,
    foodCounter: 0,
    foodIdCounter: 0,
    foodArr: [],

    // room
    players: [
        // {
        //     userId: 1,
        //     userName: 1,
        //     score: 1,
        //
        // }
    ],
    roomId: 0,
    ownerId: 0,
    isOwner: false,

    // game status
    isGameStart: false,
    isGameOver: false,
    isGameWin: false,
    gameTime: 180,

    // mvs status
    // 1. 未
    // 2  sdk 过程中
    // 3. sdk ok
    // 4. sdk error
    // 5. response 过程中
    // 6. response ok
    // 7. response error
    initStatus: 1,
    registerStatus: 1,
    loginStatus: 1,
    createRoomStatus: 1,
    joinRandomRoomStatus: 1,
    joinRoomStatus: 1,
    leaveRoomStatus: 1,
    joinOverStatus: 1,
    logoutStatus: 1,
    getRoomListStatus: 1,
    kickPlayerStatus: 1,

    halfLeaveRoomStatus: 1,

    // for response
    gameStartEventSequence: 0,


    isInCoverView: true,
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
    isRoomNumTime :5000,
    robotIDs:[99999,88888]
};
