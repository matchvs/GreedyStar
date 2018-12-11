public class Const {

    //准备
    public static int USER_PREPARE = 1;
    //正在进行游戏
    public static int USER_IN_THE_GAME = 2;
    //死亡
    public static int USER_DIE = 3;

    //玩家初始体积
    public static int USER_SIZE = 20;

    //初始移动速度
    public static int SPEED = 5;
    public static int FPS = 20;



    public static int  USER_MIN_SPEED = 1;

    //星星的初始数量
    public static int FOOD_INITIAL_NUB= 60;

    public static int[] FOOD_INITIAL_SIZE = {2,3,8};

    //星星分数列表
    public static int[] scoreList = {20, 40, 60};

    //地图的宽和高
    public static int width = 2560, height = 1440;

    // 星星展示
    public static int FOOD_SHOW = 1;
    //星星隐藏
    public static int FOOD_HIDE = 2;

    //玩家增加200分体积加1
    public static int SIZE_MULTIPLE = 200;

    // 玩家每增加3000分就减慢一速度
    public static int SPEED_MULTIPLE = 3000;

    // 玩家加速指令速度增加值
    public static int SPEED_UP = 2;

    // 玩家每个加速指令消耗分数
    public static int SPEED_DISSIPATION_SCORE = 3;

    //游戏时间 秒
    public static int GAME_TIME = 120;

    //计算FPS次玩家位置， 当局游戏事件为 GAME_TIM秒
    public static int GAME_TIME_NUM = FPS*GAME_TIME;

}
