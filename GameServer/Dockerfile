FROM java:8  AS build-env
WORKDIR /gameServer-java
COPY GameServer-Java.jar /gameServer-java
COPY Config.json /gameServer-java
COPY Makefile /gameServer-java
CMD java  -jar GameServer-Java.jar -vmargs -Xms64M -Xmx200M -XX:PermSize=32M -XX:MaxPermSize=56M

#FROM java:alpine

#WORKDIR /gameServer-java  

#COPY --from=build-env /gameServer-java .

#ENTRYPOINT ["java", "gameServer-java.jar"]
