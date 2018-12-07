

import io.grpc.stub.StreamObserver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import stream.Simple;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;

/**
 * 房间
 */
public class GreedyStarRoom extends IGameServerRoomHandler.Room {

    //    public long roomID; // 房间ID
    public ArrayList<GreedStarUser> userList; //玩家列表
    public ArrayList<Food> foodList = new ArrayList<>(); //星星列表
    private Logger log = LoggerFactory.getLogger("GreedyStarRoom");
    private App app;
    public int foodNum;
    public int countDown = Const.GAME_TIME;

//    private int status = 0;
//    private static int GameOver = 1;
//    private static int TOTAL_TIME = 5 * 60 * 1000;
//    private long currentTime = 0;
//    private long createTime = 0;
//30*180

    Runnable runnable = new Runnable() {
        @Override
        public void run() {
//            countDown--;
            if (countDown <=0) {
                destroy();
                GameServerMsg msg = new GameServerMsg("GameOver", "");
                app.sendMsgToAllUserInRoom(ID, JsonUtil.toString(msg).getBytes());
            } else {
                if (userList != null) {
                    isUserContain();
                    isPersonContain();
                    isBorderContain();
                    isFoodListFull();
                    roomUserRank();
                    if (personMove()) {
                        GameServerMsg msg = new GameServerMsg("move", userList);
                        boolean sendResult = app.sendMsgToAllUserInRoom(ID, JsonUtil.toString(msg).getBytes());
                        if (!sendResult) {
                            log.info("send fail destroy room");
                            destroy();
                        }

                    }
                }
            }
        }
    };


    private void init() {
        log.info("roomID :" + ID + "初始定时器");
//        GreedyStarRoom.this.createTime = System.currentTimeMillis();
//        foodNum = 0;
        Main.gameServer.setInterval(runnable, Const.FPS);
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
    public void isUserContain() {
        for (int i = 0; i < userList.size(); i++) {
            GreedStarUser p1 = userList.get(i);
            for (int j = i + 1; j < userList.size(); j++) {
                GreedStarUser p2 = userList.get(j);
                if (Utils.isCollisionWithCircle(p1.x, p1.y, p1.size, p2.x, p2.y, p2.size)) {
                    if (p1.score == p2.score) {
                        break;
                    }
                    GreedStarUser win = p1.score > p2.score ? p1 : p2;
                    GreedStarUser lose = p1.score < p2.score ? p1 : p2;
                    win.score += lose.score;
                    lose.resetState();
                }
            }
        }

    }

    /**
     * 移动
     */
    public boolean personMove() {
        boolean isMove = false;
        for (int i = 0; i < userList.size(); i++) {
            if (userList.get(i).move()) {
                isMove = true;
            }
        }
        return isMove;
    }

    /**
     * 玩家每移动一步就判断他与其他星星是否碰撞
     */
    private void isPersonContain() {
        for (int i = 0; i < userList.size(); i++) {
            GreedStarUser user = userList.get(i);
            for (int j = 0; j < foodList.size(); j++) {
                Food food = foodList.get(j);
                if (Utils.isCollisionWithCircle(food.x, food.y, food.size, user.x, user.y, user.size)) {
                    user.score += food.score;
                    user.size = Const.USER_SIZE + user.score / Const.SIZE_MULTIPLE;
                    int speed = Const.SPEED - user.score / Const.SPEED_MULTIPLE;
                    user.speed = speed > Const.USER_MIN_SPEED ? speed : Const.USER_MIN_SPEED;
                    GameServerMsg msg = new GameServerMsg("removeFood", foodList.get(j).ID);
                    foodList.remove(j);
                    app.sendMsgToAllUserInRoom(ID, JsonUtil.toString(msg).getBytes());
                }
            }
        }

    }

    /**
     * 玩家边界检测
     */
    private void isBorderContain() {
        for (int i = 0; i < userList.size(); i++) {
            GreedStarUser user = userList.get(i);
            int lAcme = user.x - user.size;
            int rAcme = user.x + user.size;
            int uAcme = user.y + user.size;
            int dAcme = user.y - user.size;
            if (lAcme > 0 && rAcme < Const.width && uAcme < Const.height && dAcme > 0) {
//                break;
            } else {
                user.resetState();
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
                    GameServerMsg msg = new GameServerMsg("addFood", list);
                    app.sendMsgToAllUserInRoom(ID, JsonUtil.toString(msg).getBytes());
                }
                return;
            }

        }
    }

    /**
     * 房间用户排名
     */
    private void roomUserRank() {
        Collections.sort(userList, new Comparator<GreedStarUser>() {
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
}
