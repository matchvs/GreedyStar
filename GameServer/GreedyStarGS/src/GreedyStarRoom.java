

import io.grpc.stub.StreamObserver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import stream.Simple;

import java.util.ArrayList;
import java.util.Comparator;

/**
 * 房间
 */
public class GreedyStarRoom extends IGameServerRoomHandler.Room {

    public ArrayList<GreedStarUser> userList; //玩家列表
    public ArrayList<Food> foodList = new ArrayList<>(); //星星列表
    private Logger log = LoggerFactory.getLogger("GreedyStarRoom");
    private App app;
    public int foodNum;
    public int countDown = Const.GAME_TIME_NUM;


    private Runnable runnable = new Runnable() {
        @Override
        public void run() {
            countDown--;
            if (countDown <= 0) {
                app.sendMsg(ID,"GameOver", "");
                destroy();
            } else {
                if (userList != null) {
                    isUserContain();
                    isPersonContain();
                    isBorderContain();
                    isFoodListFull();
                    roomUserRank();
                    isUserRevive();
                    if (personMove()) {
                        boolean sendResult = app.sendMsg(ID,"move", userList);
                        if (!sendResult) {
                            log.info("send fail destroy room");
                            destroy();
                        }
                    }
                }
            }
        }
    };

    /**
     * 判断玩家的复活状态
     */
    private void isUserRevive() {
        for (int i = 0; i < userList.size(); i++) {
            GreedStarUser p1 = userList.get(i);
            if (p1.status == Const.USER_DIE) {
                if (p1.deathTime - this.countDown >= (Const.FPS * Const.DEATH_TIME)) {
                    p1.status = Const.USER_IN_THE_GAME;
                }
            }
        }
    }


    private void init() {
        log.info("roomID :" + ID + "初始定时器");
        Main.gameServer.setInterval(runnable, 1000 / Const.FPS);
    }

    public void destroy() {
        log.info("销毁定时器");
        Main.gameServer.clearInterval(runnable);
    }


    public GreedyStarRoom(long roomID, StreamObserver<Simple.Package.Frame> clientChannel, App app) {
        super(roomID, clientChannel);
        this.app = app;
        init();
    }


    /**
     * 检查所有人的碰撞
     */
    private void isUserContain() {
        for (int i = 0; i < userList.size(); i++) {
            GreedStarUser p1 = userList.get(i);
            if (p1.status == Const.USER_IN_THE_GAME) {
                for (int j = i + 1; j < userList.size(); j++) {
                    GreedStarUser p2 = userList.get(j);
                    if (p2.status == Const.USER_IN_THE_GAME) {
                        if (Utils.isCollisionWithCircle(p1.x, p1.y, p1.size, p2.x, p2.y, p2.size)) {
                            if (p1.score == p2.score) {
                                break;
                            }
                            GreedStarUser win = p1.score > p2.score ? p1 : p2;
                            GreedStarUser lose = p1.score < p2.score ? p1 : p2;
                            win.score += lose.score;
                            this.userDie(lose, this.countDown);
                        }
                    }
                }
            }
        }

    }

    /**
     * 移动
     */
    private boolean personMove() {
        boolean isMove = false;
        for (GreedStarUser anUserList : userList) {
            if (anUserList.status == Const.USER_IN_THE_GAME) {
                if (anUserList.move()) {
                    isMove = true;
                }
            }
        }
        return isMove;
    }

    /**
     * 玩家每移动一步就判断他与其他星星是否碰撞
     */
    private void isPersonContain() {
        for (GreedStarUser user : userList) {
            if (user.status == Const.USER_IN_THE_GAME) {
                for (int j = 0; j < foodList.size(); j++) {
                    Food food = foodList.get(j);
                    if (Utils.isCollisionWithCircle(food.x, food.y, food.size, user.x, user.y, user.size)) {
                        user.score += food.score;
                        user.size = Const.USER_SIZE + user.score / Const.SIZE_MULTIPLE;
                        int speed = Const.SPEED - user.score / Const.SPEED_MULTIPLE;
                        user.speed = speed > Const.USER_MIN_SPEED ? speed : Const.USER_MIN_SPEED;
                        app.sendMsg(ID,"removeFood", foodList.get(j).ID);
                        foodList.remove(j);
                    }
                }
            }
        }
    }

    /**
     * 玩家边界检测
     */
    private void isBorderContain() {
        for (GreedStarUser user : userList) {
            if (user.status == Const.USER_IN_THE_GAME) {
                int lAcme = user.x - user.size;
                int rAcme = user.x + user.size;
                int uAcme = user.y + user.size;
                int dAcme = user.y - user.size;
                if (lAcme > 0 && rAcme < Const.width && uAcme < Const.height && dAcme > 0) {
//                break;
                } else {
                    this.userDie(user, this.countDown);
                }
            }
        }
    }

    /**
     * 判断房间食物是否是满的
     */
    private void isFoodListFull() {
        ArrayList<Food> list = new ArrayList<>();
        for (int i = 0; i < Const.FOOD_INITIAL_NUB; i++) {
            if (foodList.size() < Const.FOOD_INITIAL_NUB) {
                Food food = Food.addFood(foodNum);
                this.foodList.add(food);
                foodNum++;
                list.add(food);
            } else {
                if (list.size() > 0) {
                    app.sendMsg(ID,"addFood", list);
                }
                return;
            }
        }
    }

    /**
     * 房间用户排名
     */
    private void roomUserRank() {
        userList.sort(new Comparator<GreedStarUser>() {
            @Override
            public int compare(GreedStarUser o1, GreedStarUser o2) {
                if (o1.score == o2.score) {
                    return 0;
                }
                if (o1.score < o2.score) {
                    return 1;
                } else {
                    return -1;
                }
            }
        });
    }

    private void userDie(GreedStarUser user, int ditTime) {
        user.die(ditTime);
        app.sendMsg(ID, "die", user.userID);
    }

}
