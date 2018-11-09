import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Field;

public class ReflectUtil {
    static Logger logger = LoggerFactory.getLogger(ReflectUtil.class);

    public static Object getMemberValue(Object instance, String fieldName) throws NoSuchFieldException, IllegalAccessException {
        return getMemberValue2(instance, instance.getClass(), fieldName);
    }

    public static Object getMemberValue2(Object instance, Class clazz, String fieldName) throws NoSuchFieldException, IllegalAccessException {
        logger.info("instance " + instance);
        logger.info("class " + clazz);
        logger.info("getDeclaredClasses " + clazz.getDeclaredClasses()[0]);
        logger.info("fieldName " + fieldName);
        Field f1 = clazz.getDeclaredField(fieldName);
        f1.setAccessible(true);
        return f1.get(instance);
    }
}
