import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Random;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

public class Utils {




    /**
     * 获取一个随机分数
     *
     * @return
     */
    public static int getRandomScore() {
        return Const.scoreList[(int) getRandom(0, Const.scoreList.length - 1)];
    }

//    public static void main(String[] args) {
//        for (int i = 0; i < Const.FOOD_INITIAL_NUB; i++) {
//            int[] position = getRandomPosition();
//            System.out.println("x:"+position[0] + "y:"+ position[1]);
//        }
//    }


    /**
     * 返回一个随机的位置
     *
     * @return
     */
    public static int[] getRandomPosition() {
        int pad = 40;
        int minX = 0 + 40, minY = 0 + pad, maxX = Const.width - pad, maxY = Const.height - pad;
        int x = (int) Utils.getRandom(minX, maxX);
        int y = (int) Utils.getRandom(minY, maxY);
        int[] position = new int[2];
        position[0] = x;
        position[1] = y;
        return position;
    }


    /**
     * 返回固定范围内的一个随机数
     *
     * @param min 最小数
     * @param max 最大数
     * @return
     */
    public static double getRandom(int min, int max) {
        Random random = new Random();
        return Math.floor(random.nextInt(max) + min);
    }


    /**
     * 一个节点是否包含另一个节点
     *
     * @param fond 被吃者
     * @param user 吃者
     * @return
     */
    public static boolean isContain(Food fond, GreedStarUser user) {
        if (fond.x >= user.x && fond.x <= user.x + ((user.size + 1) * fond.size)
                && fond.y >= user.y
                && fond.y <= user.y + ((user.size + 1) * fond.size)) {
            return true;
        }
        return false;
    }

    /**
     * 判断两个玩家是否相撞
     *
     * @param other
     * @param user
     * @return
     */
    public static boolean isUserContain(GreedStarUser other, GreedStarUser user) {
        if (other.x != 0 && other.y != 0 && user.x != 0 && user.y != 0
                && other.x >= user.x
                && other.x <= user.x + ((user.size + 1) * other.size)
                && other.y >= user.y
                && other.y <= user.y + ((user.size + 1) * other.size)) {
            return true;
        }
        return false;
    }


    /**
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @param r1
     * @param r2
     * @return
     */
    public static boolean isCollisionWithCircle(int x1, int y1,int r1,int x2, int y2, int r2) {
        //Math.pow(double x, double y): X的Y次方
        if (Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) <= r1 + r2) {
            //如果两圆的圆心距小于或等于两圆半径则认为发生碰撞
            return true;
        }
        return false;
    }

    public static void main(String[] args){
//        int speed = 2;
//        int a;
//        a =  speed > Const.USER_MIN_SPEED ? speed : Const.USER_MIN_SPEED;
//        System.out.println(a);
    }


}
