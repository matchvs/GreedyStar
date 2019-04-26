import jdk.nashorn.internal.runtime.logging.DebugLogger;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.helpers.Util;
import sun.rmi.runtime.Log;

/**
 * 玩家
 */
public class GreedStarUser extends IGameServerRoomHandler.User {

    public String name;
    public int status;
    public int deathTime = Const.DEFAULT_DEATH_TIME;  // -1 代表没有死亡
    public int score;
    public int size; //体积
    public int x;
    public int y;
    private int speed;
    public transient Input input;
    private Logger log = LoggerFactory.getLogger(GreedStarUser.class);
//    public int rank = 0; //排名

    public GreedStarUser(int userID, int status, int score, int size, int x, int y,int speed,Input input) {
        this.userID = userID;
        this.status = status;
        this.score = score;
        this.size = size;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.input = input;
    }




    /**
     * 移动
     * @return
     */
    public boolean move() {
        boolean isMove = false;
        int userSpeed;
        if ( score >= Const.SPEED_DISSIPATION_SCORE &&input.p == 1 ) {
            score -= Const.SPEED_DISSIPATION_SCORE;
            userSpeed = this.speed +Const.SPEED_UP;
        } else {
            userSpeed = this.speed;
        }
        if (input != null) {
            if (input.l == 1) {
                this.x -= userSpeed;
                isMove = true;
            }
            if (input.r == 1) {
                this.x += userSpeed;
                isMove = true;
            }
            if (input.u == 1) {
                this.y += userSpeed;
                isMove = true;
            }
            if (input.d == 1) {
                this.y -= userSpeed;
                isMove = true;
            }
        }
        return isMove;
    }

    public void die(int ditTime) {
        log.info(" die : {}",userID);
        this.status = Const.USER_DIE;
        Main.gameServer.setTimeOut(new Runnable() {
            @Override
            public void run() {
                GreedStarUser.this.relive();
            }
        },ditTime*1000);
    }

    public void relive() {
        int[] position = Utils.getRandomPosition();
        this.score = 0;
        this.size = Const.USER_SIZE;
        this.x = position[0];
        this.y = position[1];
        this.speed = Const.SPEED;
        this.status = Const.USER_IN_THE_GAME;
        log.info(" relive : {}",userID);
    }


}
