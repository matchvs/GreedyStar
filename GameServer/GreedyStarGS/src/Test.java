public class Test {

    static class A {
        public int a = 0;
        public Object ab = new Object() {
            B b = new B();
        };

        static class B {
            public int b = 0;
        }
    }

    public static void main(String[] args) throws NoSuchFieldException, IllegalAccessException {

        A a = new A();
        Object ab = ReflectUtil.getMemberValue(a, "ab");
        ReflectUtil.getMemberValue2(ab,A.B.class, "b");
    }
}
