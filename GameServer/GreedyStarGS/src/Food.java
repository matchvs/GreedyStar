/**
 * 食物
 */
public class Food {

    public int x;
    public int y;
    public int score;
    public int ID;
    public int size;


    public String toString() {
        return x + ","+y +","+ score+","+ ID+ ",";
    }


    /**
     * 增加星星
     */
    public static Food addFood(int ID) {
        int[] Position =  Utils.getRandomPosition();
        Food food = new Food();
        food.x = Position[0];
        food.y = Position[1];
        food.ID = ID;
        food.score =Utils.getRandomScore();
        if (food.score == 20) {
            food.size = 20;
        }else if (food.score == 40) {
            food.size = 40;
        } else if (food.score == 60) {
            food.size = 60;
        }
        return food;
    }

}
