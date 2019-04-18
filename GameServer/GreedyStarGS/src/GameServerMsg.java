import java.util.ArrayList;

public class GameServerMsg {

    public String type;
    public Object data;
    public Object profile;

    public GameServerMsg(String type,Object data) {
        this.type = type;
        this.data = data;
    }
}
