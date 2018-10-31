module.exports = {
    // me
    userID : 0,
    userName: "",
    avatarUrl: "",
    isWX:false,
    // game
    SCENT_WIDTH: 0,
    SCENT_HEIGHT: 0,

    // mvs
    // gameId: 201151,
    // appKey: "15be77cc3ce84c3a9d9750adb43f08c5",
    // secretKey: "b55d351ad6f44b018e40e134c878e649",
    gameVersion: 1,
    channel: "Matchvs",
    platform: "alpha",
    // TEST:
    // platform: "alpha",
    deviceId: "123456789",
    gatewayId: 0,
    token: "",

    // test
    gameID: 202326,
    appKey: '495cf9da60df4fae854ef9e595176d4e#M',
    secretKey: '170313f9147a4fdf9b9b56a082630369',

    // client room event
    GAME_TIME_EVENT: 'game_time_event',
    GAME_START_EVENT: 'game_start_event',
    GAME_START_EVENT_BY_HALF: 'game_start_event_by_half',


    // server room event
    READY_TO_GAME_START_EVENT: 'ready_to_game_start_event',
    CLOSE_READY_TO_GAME_START_EVENT: 'close_ready_to_game_start_event',
    READY_GAME_TIME_EVENT: 'ready_game_time_event',
    CANNOT_LEAVE_ROOM_EVENT: 'cannot_leave_room_event',

    // game event
    OTHER_BIRTH_EVENT: 'other_birth_event',
    OTHER_MOVE_EVENT: 'other_move_event',
    OTHER_EAT_A_FOOD_EVENT: 'other_eat_a_food_event',
    OTHER_DIE_EVENT: 'other_die_event',
    OTHER_VIVID_EVENT: 'other_vivid_event',
    OTHER_NEW_FOOD_EVENT: 'other_new_food_event',
    OTHER_CHANGE_SIZE_EVENT: 'other_change_size_event',
    OTHER_HALF_LEAVE_EVENT: 'other_half_leave_event',

    // 用于僵尸房间处理
    USER_IN_THE_ROOM: 'user_in_the_room',
    GAME_HAS_START_EVENT: 'game_has_start_event',

    // 吃和被吃的判断,额外的动画效果
    CAN_I_BE_EATEN: 'can_i_be_eaten',
    YOU_CAN_BE_EATEN: 'you_can_be_eaten',

    OTHERS_BIRTH_EVENT: 'others_birth_event',
    OTHERS_ADD_FOODS_EVENT: 'others_add_foods'
};
