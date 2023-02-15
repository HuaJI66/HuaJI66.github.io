---
layout: post
title: SpringBoot笔记-zero
subtitle: SpringBoot学习笔记
categories: SpringBoot
tags: [SpringBoot]
banner:
  video: null             # Video banner source
  loop: true              # Video loop
  volume: 0               # Video volume (100% is 1.0)
  start_at: 0             # Video start time
  image: /assets/images/banners/spy2.jpg    # Image banner source
---
# SpringBoot笔记

## Tomcat配置SLL证书

1. 申请证书并下载

   ![image-20221012095110277](/assets/images/springboot/image-20221012095110277.png)

2. 将.pfx文件复制到resources下

   ![image-20221012095126881](/assets/images/springboot/image-20221012095126881.png)

3. 配置application.yml

```yaml
spring:
  application:
    name: pika
server:
  port: 443
  ssl:
    key-store: classpath:8604835_host.pikachuvirtual.top.pfx
    key-store-password: Qni83X9e
    key-store-type: PKCS12
    ciphers: TLS_RSA_WITH_AES_128_CBC_SHA,TLS_RSA_WITH_AES_256_CBC_SHA,TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA,TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256,TLS_RSA_WITH_AES_128_CBC_SHA256,TLS_RSA_WITH_AES_256_CBC_SHA256

```

https 访问有锁:

![image-20221012095220026](/assets/images/springboot/image-20221012095220026.png)

http 访问显示不安全:

![image-20221012095250171](/assets/images/springboot/image-20221012095250171.png)



## 热部署开发插件Jrebel

[生成新的 GUID](https://www.guidgen.com/)

将生成的GUID 粘贴到此处

> https://jrebel.qekang.com/

如：
https://jrebel.qekang.com/cf0c9d95-c31f-4e75-bc5a-146291b8bb71
![在这里插入图片描述](/assets/images/springboot/20210430135128716.png)
![在这里插入图片描述](/assets/images/springboot/20210430135353227.png)



## 注解

### @Autowired 与@Resource的区别（详细）

[spring](http://lib.csdn.net/base/javaee)不但支持自己定义的@Autowired注解，还支持几个由JSR-250规范定义的注解，它们分别是@Resource、@PostConstruct以及@PreDestroy。
　　@Resource的作用相当于@Autowired，只不过@Autowired按byType自动注入，而@Resource默认按 byName自动注入罢了。@Resource有两个属性是比较重要的，分是name和type，Spring将@Resource注解的name属性解析为bean的名字，而type属性则解析为bean的类型。所以如果使用name属性，则使用byName的自动注入策略，而使用type属性时则使用byType自动注入策略。如果既不指定name也不指定type属性，这时将通过反射机制使用byName自动注入策略。
　　@Resource装配顺序
　　1. 如果同时指定了name和type，则从Spring上下文中找到唯一匹配的bean进行装配，找不到则抛出异常
　　2. 如果指定了name，则从上下文中查找名称（id）匹配的bean进行装配，找不到则抛出异常
　　3. 如果指定了type，则从上下文中找到类型匹配的唯一bean进行装配，找不到或者找到多个，都会抛出异常
　　4. 如果既没有指定name，又没有指定type，则自动按照byName方式进行装配；如果没有匹配，则回退为一个原始类型进行匹配，如果匹配则自动装配；

@Autowired 与@Resource的区别：

 

1、 @Autowired与@Resource都可以用来装配bean. 都可以写在字段上,或写在setter方法上。

2、 @Autowired默认按类型装配（这个注解是属业spring的），默认情况下必须要求依赖对象必须存在，如果要允许null值，可以设置它的required属性为false，如：@Autowired(required=false) ，如果我们想使用名称装配可以结合@Qualifier注解进行使用，如下：

```java
@Autowired () @Qualifier ( "baseDao" )
private BaseDao baseDao;
```

3、@Resource（这个注解属于J2EE的），默认按照名称进行装配，名称可以通过name属性进行指定，如果没有指定name属性，当注解写在字段上时，默认取字段名进行安装名称查找，如果注解写在setter方法上默认取属性名进行装配。当找不到与名称匹配的bean时才按照类型进行装配。但是需要注意的是，如果name属性一旦指定，就只会按照名称进行装配。

```java
@Resource (name= "baseDao" )
private BaseDao baseDao;
```

推荐使用：@Resource注解在字段上，这样就不用写setter方法了，并且这个注解是属于J2EE的，减少了与spring的耦合。这样代码看起就比较优雅。

 

[spring @Qualifier注解](http://blog.csdn.net/clerk0324/article/details/25198457)

 

@Autowired是根据类型进行自动装配的。如果当Spring上下文中存在不止一个UserDao类型的bean时，就会抛出BeanCreationException异常;如果Spring上下文中不存在UserDao类型的bean，也会抛出BeanCreationException异常。我们可以使用@Qualifier配合@Autowired来解决这些问题。如下：

①可能存在多个UserDao实例

```java
@Autowired   
@Qualifier("userServiceImpl")   
public IUserService userService;
```

```java
@Autowired   
public void setUserDao(@Qualifier("userDao") UserDao userDao) {   
    this.userDao = userDao;   
}  
```

 

这样Spring会找到id为userServiceImpl和userDao的bean进行装配。

 

②可能不存在UserDao实例

 

```java
@Autowired(required = false)   
public IUserService userService  
```



个人总结：

@Autowired//默认按type注入
@Qualifier("cusInfoService")//一般作为@Autowired()的修饰用
@Resource(name="cusInfoService")//默认按name注入，可以通过name和type属性进行选择性注入

 

一般@Autowired和@Qualifier一起用，@Resource单独用。

当然没有冲突的话@Autowired也可以单独用

 

 

-----------常用注解--------

 

--定义Bean的注解

 

@Controller

@Controller("Bean的名称")

定义控制层Bean,如Action

 

@Service      

@Service("Bean的名称")

定义业务层Bean

 

@Repository  

@Repository("Bean的名称")

定义DAO层Bean

 

@Component  

定义Bean, 不好归类时使用.

 

--自动装配Bean （选用一种注解就可以）

@Autowired  (Srping提供的)

默认按类型匹配,自动装配(Srping提供的)，可以写在成员属性上,或写在setter方法上

 

@Autowired(required=true)  

一定要找到匹配的Bean，否则抛异常。 默认值就是true 

 

@Autowired

@Qualifier("bean的名字") 

按名称装配Bean,与@Autowired组合使用，解决按类型匹配找到多个Bean问题。

 

@Resource  JSR-250提供的

默认按名称装配,当找不到名称匹配的bean再按类型装配.

可以写在成员属性上,或写在setter方法上

可以通过@Resource(name="beanName") 指定被注入的bean的名称, 要是未指定name属性, 默认使用成员属性的变量名,一般不用写name属性.

@Resource(name="beanName")指定了name属性,按名称注入但没找到bean, 就不会再按类型装配了.

 

@Inject  是JSR-330提供的

按类型装配，功能比@Autowired少，没有使用的必要。

 

--定义Bean的作用域和生命过程

@Scope("prototype")

值有:singleton,prototype,session,request,session,globalSession

 

@PostConstruct 

相当于init-method,使用在方法上，当Bean初始化时执行。

 

@PreDestroy 

相当于destory-method，使用在方法上，当Bean销毁时执行。

 

--声明式事务

@Transactional  

@Autowired @Resource @Qualifier的区别

实用理解：@Autowired @Resource 二选其一，看中哪个就用哪个。

 

简单理解：

@Autowired 根据类型注入， 

@Resource 默认根据名字注入，其次按照类型搜索

@Autowired @Qualifie("userService") 两个结合起来可以根据名字和类型注入

 

复杂理解：

比如你有这么一个Bean

@Service(“UserService”)

public Class UserServiceImpl implements UserService｛｝;

现在你想在UserController 里面使用这个UserServiceImpl 

```java
public Class UserController ｛

@AutoWire  
//当使用这个注入的时候上面的 UserServiceImpl 只需要这样写 @Service，这样就会自动找到UserService这个类型以及他的子类型。UserServiceImpl 实现了UserService，所以能够找到它。不过这样有一个缺点，就是当UserService实现类有两个以上的时候，这个时候会找哪一个呢，这就造成了冲突，所以要用@AutoWire注入的时候要确保UserService只有一个实现类。

//@Resource 默认情况下是按照名称进行匹配，如果没有找到相同名称的Bean，则会按照类型进行匹配，有人可能会想了，这下好了，用这个是万能的了，不用管名字了，也不用管类型了，但这里还是有缺点。首先，根据这个注解的匹配效果可以看出，它进行了两次匹配，也就是说，如果你在UserService这个类上面这样写注解，@Service,它会怎么找呢，首先是找相同名字的，如果没有找到，再找相同类型的，而这里的@Service没有写名字，这个时候就进行了两次搜索，显然，速度就下降了许多。也许你还会问，这里的@Service本来就没有名字，肯定是直接进行类型搜索啊。其实不是这样的，UserServiceImpl 上面如果有@Service默认的名字 是这个userServiceImpl，注意看，就是把类名前面的大写变成小写，就是默认的Bean的名字了。 @Resource根据名字搜索是这样写@Resource("userService")，如果你写了这个名字叫userService，那么UserServiceImpl上面必须也是这个名字，不然还是会报错。

 

//@Autowired @Qualifie("userService") 是直接按照名字进行搜索，也就是说，对于UserServiceImpl 上面@Service注解必须写名字，不写就会报错，而且名字必须是@Autowired @Qualifie("userService") 保持一致。如果@Service上面写了名字，而@Autowired @Qualifie() ，一样会报错。



private UserService userService;

｝
```

说了这么多，可能你有些说晕了，那么怎么用这三个呢，要实际的工作是根据实际情况来使用的，通常使用AutoWire和@Resource多一些，bean的名字不用写，而UserServiceImpl上面能会这样写 @Service("userService")。这里的实际工作情况，到底是什么情况呢？说白了就是整个项目设计时候考虑的情况，如果你的[架构](http://lib.csdn.net/base/architecture)设计师考虑的比较精细，要求比较严格，要求项目上线后的访问速度比较好，通常是考虑速度了。这个时候@AutoWire没有@Resource好用，因为@Resource可以根据名字来搜索，是这样写的@Resource("userService")。这个@Autowired @Qualifie("userService") 也可以用名字啊，为什么不用呢，原因很简单，这个有点长，不喜欢，增加工作量。因为根据名字搜索是最快的，就好像查[数据库](http://lib.csdn.net/base/mysql)一样，根据Id查找最快。因为这里的名字与数据库里面的ID是一样的作用。这个时候，就要求你多写几个名字，工作量自然就增加了。而如果你不用注解，用xml文件的时候，对于注入Bean的时候要求写一个Id，xml文件时候的id就相当于这里的名字。

 

说了那么多没用，你能做的就是简单直接，什么最方便就用什么，

你就直接用@Resource得了，如果你喜欢用@AutoWire也行，不用写名字。

 

通常情况一个Bean的注解写错了，会报下面这些错误，最为常见，

No bean named 'user' is defined，这个表示没有找到被命名为user的Bean，通俗的说，就是名字为user的类型，以及它的子类型，出现这个错误的原因就是注入时候的类型名字为user，而搜索的时候找不到，也就是说可能那个搜索的类型，并没有命令为user，解决办法就是找到这个类型，去命令为user，

 

下面这个错误也常见，

No qualifying bean of type [com.service.UserService] found for dependency:

这个错误的原因就是类型上面没有加@Service这个注入，不仅仅是@Service，如果是其他层也会出现这个错误，这里我是以Service为例子说明，如果是DAO层就是没有加@Repository，Controller层，则是没有加@Controller。

还有，如果你还是想再简单点，无论是DAO,Controller，Service三个层，都可以用这个注解，@Component，这个注解通用所有的Bean，这个时候你可能会说了，有通常的为什么用的人少呢，那是因为MVC这个分层的设计原则，用@Repository,@Service，@Controller，这个可以区别MVC原则中的DAO,Service，Controller。便于识别。

 

 

博客2：

[spring](http://www.iteye.com/blogs/tag/spring) [autowired](http://www.iteye.com/blogs/tag/autowired) [qualifier](http://www.iteye.com/blogs/tag/qualifier) [bytype](http://www.iteye.com/blogs/tag/bytype) [byname](http://www.iteye.com/blogs/tag/byname) 

　在使用Spring框架中@Autowired标签时默认情况下使用

Java代码 

```java
 @Autowired
```

注释进行自动注入时，Spring 容器中匹配的候选 Bean 数目必须有且仅有一个。当找不到一个匹配的 Bean 时，Spring 容器将抛出 BeanCreationException 异常，并指出必须至少拥有一个匹配的 Bean。

@Autowired 默认是按照byType进行注入的，如果发现找到多个bean，则，又按照byName方式比对，如果还有多个，则报出异常。

例子：

@Autowired
private ExamUserMapper examUserMapper; - ExamUserMapper是一个接口

 

1. spring先找类型为ExamUserMapper的bean

2. 如果存在且唯一，则OK；

3. 如果不唯一，在结果集里，寻找name为examUserMapper的bean。因为bean的name有唯一性，所以，到这里应该能确定是否存在满足要求的bean了

 

```
@Autowired也可以手动指定按照byName方式注入，使用@Qualifier标签，例如：
@Autowired` `() ` `@Qualifier` `(` `"baseDao"` `)
```



　　Spring 允许我们通过

```java
@Qualifier
```

注释指定注入 Bean 的名称，这样歧义就消除了，可以通过下面的方法解决异常。 

```java
@Qualifier("XXX")
```

中的 XX是 Bean 的名称，所以 @Autowired 和 @Qualifier 结合使用时，自动注入的策略就从 byType 转变成 byName 了。 

　　@Autowired 可以对成员变量、方法以及构造函数进行注释，而 @Qualifier 的标注对象是成员变量、方法入参、构造函数入参。 

  Spring不但支持自己定义的@Autowired注解，还支持几个由JSR-250规范定义的注解，它们分别是@Resource、@PostConstruct以及@PreDestroy。 



```java
@Resource
```

的作用相当于@Autowired，只不过@Autowired按byType自动注入，而@Resource默认按 byName自动注入罢了。@Resource有两个属性是比较重要的，分是name和type，Spring将@Resource注解的name属性解析为bean的名字，而type属性则解析为bean的类型。所以如果使用name属性，则使用byName的自动注入策略，而使用type属性时则使用byType自动注入策略。如果既不指定name也不指定type属性，这时将通过反射机制使用byName自动注入策略。 

　　@Resource装配顺序 
　　1. 如果同时指定了name和type，则从Spring上下文中找到唯一匹配的bean进行装配，找不到则抛出异常 
　　2. 如果指定了name，则从上下文中查找名称（id）匹配的bean进行装配，找不到则抛出异常 
　　3. 如果指定了type，则从上下文中找到类型匹配的唯一bean进行装配，找不到或者找到多个，都会抛出异常 
　　4. 如果既没有指定name，又没有指定type，则自动按照byName方式进行装配；如果没有匹配，则回退为一个原始类型进行匹配，如果匹配则自动装配

### Spring @Order注解的使用

注解@Order或者接口Ordered的作用是定义Spring IOC容器中Bean的执行顺序的优先级，而不是定义Bean的加载顺序，Bean的加载顺序不受@Order或Ordered接口的影响；

#### @Order的注解源码解读

```java
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD, ElementType.FIELD})
@Documented
public @interface Order {

	/**
	 * 默认是最低优先级,值越小优先级越高
	 */
	int value() default Ordered.LOWEST_PRECEDENCE;

}
```

- 注解可以作用在类(接口、枚举)、方法、字段声明（包括枚举常量）；
- 注解有一个int类型的参数，可以不传，默认是最低优先级；
- 通过常量类的值我们可以推测参数值越小优先级越高；

#### Ordered接口类

```java
package org.springframework.core;

public interface Ordered {
    int HIGHEST_PRECEDENCE = -2147483648;
    int LOWEST_PRECEDENCE = 2147483647;

    int getOrder();
}
```

#### 创建BlackPersion、YellowPersion类，这两个类都实现CommandLineRunner

> 实现CommandLineRunner接口的类会在Spring IOC容器加载完毕后执行，适合预加载类及其它资源；也可以使用ApplicationRunner,使用方法及效果是一样的

```java
package com.yaomy.common.order;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * @Description: Description
 * @ProjectName: spring-parent
 * @Version: 1.0
 */
@Component
@Order(1)
public class BlackPersion implements CommandLineRunner {
    @Override
    public void run(String... args) throws Exception {
        System.out.println("----BlackPersion----");
    }
}
```

```java
package com.yaomy.common.order;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * @Description: Description
 * @ProjectName: spring-parent
 * @Version: 1.0
 */
@Component
@Order(0)
public class YellowPersion implements CommandLineRunner {
    @Override
    public void run(String... args) throws Exception {
        System.out.println("----YellowPersion----");
    }
}
```

#### 启动应用程序打印出结果

```java
----YellowPersion----
----BlackPersion----
```

> 我们可以通过调整@Order的值来调整类执行顺序的优先级，即执行的先后；当然也可以将@Order注解更换为Ordered接口，效果是一样的

到这里可能会疑惑IOC容器是如何根据优先级值来先后执行程序的，那接下来看容器是如何加载component的

- 看如下的启动main方法

```java
@SpringBootApplication
public class CommonBootStrap {
    public static void main(String[] args) {
        SpringApplication.run(CommonBootStrap.class, args);
    }
}
```



```java

    public ConfigurableApplicationContext run(String... args) {
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        ConfigurableApplicationContext context = null;
        Collection<SpringBootExceptionReporter> exceptionReporters = new ArrayList();
        this.configureHeadlessProperty();
        SpringApplicationRunListeners listeners = this.getRunListeners(args);
        listeners.starting();

        Collection exceptionReporters;
        try {
            ApplicationArguments applicationArguments = new DefaultApplicationArguments(args);
            ConfigurableEnvironment environment = this.prepareEnvironment(listeners, applicationArguments);
            this.configureIgnoreBeanInfo(environment);
            Banner printedBanner = this.printBanner(environment);
            context = this.createApplicationContext();
            exceptionReporters = this.getSpringFactoriesInstances(SpringBootExceptionReporter.class, new Class[]{ConfigurableApplicationContext.class}, context);
            this.prepareContext(context, environment, listeners, applicationArguments, printedBanner);
            this.refreshContext(context);
            this.afterRefresh(context, applicationArguments);
            stopWatch.stop();
            if (this.logStartupInfo) {
                (new StartupInfoLogger(this.mainApplicationClass)).logStarted(this.getApplicationLog(), stopWatch);
            }

            listeners.started(context);
            //这里是重点，调用具体的执行方法
            this.callRunners(context, applicationArguments);
        } catch (Throwable var10) {
            this.handleRunFailure(context, var10, exceptionReporters, listeners);
            throw new IllegalStateException(var10);
        }

        try {
            listeners.running(context);
            return context;
        } catch (Throwable var9) {
            this.handleRunFailure(context, var9, exceptionReporters, (SpringApplicationRunListeners)null);
            throw new IllegalStateException(var9);
        }
    }
   private void callRunners(ApplicationContext context, ApplicationArguments args) {
        List<Object> runners = new ArrayList();
        runners.addAll(context.getBeansOfType(ApplicationRunner.class).values());
        runners.addAll(context.getBeansOfType(CommandLineRunner.class).values());
        //重点来了，按照定义的优先级顺序排序
        AnnotationAwareOrderComparator.sort(runners);
        Iterator var4 = (new LinkedHashSet(runners)).iterator();
        //循环调用具体方法
        while(var4.hasNext()) {
            Object runner = var4.next();
            if (runner instanceof ApplicationRunner) {
                this.callRunner((ApplicationRunner)runner, args);
            }

            if (runner instanceof CommandLineRunner) {
                this.callRunner((CommandLineRunner)runner, args);
            }
        }

    }

    private void callRunner(ApplicationRunner runner, ApplicationArguments args) {
        try {
            //执行方法
            runner.run(args);
        } catch (Exception var4) {
            throw new IllegalStateException("Failed to execute ApplicationRunner", var4);
        }
    }

    private void callRunner(CommandLineRunner runner, ApplicationArguments args) {
        try {
            //执行方法
            runner.run(args.getSourceArgs());
        } catch (Exception var4) {
            throw new IllegalStateException("Failed to execute CommandLineRunner", var4);
        }
    }
```

> 到这里优先级类的示例及其执行原理都分析完毕；不过还是要强调下@Order、Ordered不影响类的加载顺序而是影响Bean加载如IOC容器之后执行的顺序（优先级）；

个人理解是加载代码的底层要支持优先级执行程序，否则即使配置上Ordered、@Order也是不起任何作用的







## 问题

###  'java.lang.String' that could not be found.

> Description:
>
> Parameter 0 of method secKill in com.pika.config.SecKillController required a bean of type 'java.lang.String' that could not be found.

**因为注释的时候没有把@Autowired一同注释掉，有一个空的@Autowired引起报错，导致项目启动报错。**

### Jackson冲突

> Error creating bean with name ‘requestMappingHandlerAdapter’ defined in class path resource [org/[springframework](https://so.csdn.net/so/search?q=springframework&spm=1001.2101.3001.7020)/boot/autoconfigure/web/servlet/WebMvcAutoConfiguration$EnableWebMvcConfiguration.class]: Bean instantiation via factory method failed; nested exception is org.springframework.beans

```java
org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'requestMappingHandlerAdapter' defined in class path resource [org/springframework/boot/autoconfigure/web/servlet/WebMvcAutoConfiguration$EnableWebMvcConfiguration.class]: Bean instantiation via factory method failed; nested exception is org.springframework.beans.BeanInstantiationException: Failed to instantiate [org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter]: Factory method 'requestMappingHandlerAdapter' threw exception; nested exception is org.springframework.beans.BeanInstantiationException: Failed to instantiate [com.fasterxml.jackson.datatype.jsr310.JavaTimeModule]: Unresolvable class definition; nested exception is java.lang.NoClassDefFoundError: com/fasterxml/jackson/databind/ser/std/ToStringSerializerBase


Caused by: org.springframework.beans.BeanInstantiationException: Failed to instantiate [org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter]: Factory method 'requestMappingHandlerAdapter' threw exception; nested exception is org.springframework.beans.BeanInstantiationException: Failed to instantiate [com.fasterxml.jackson.datatype.jsr310.JavaTimeModule]: Unresolvable class definition; nested exception is java.lang.NoClassDefFoundError: com/fasterxml/jackson/databind/ser/std/ToStringSerializerBase


Caused by: org.springframework.beans.BeanInstantiationException: Failed to instantiate [com.fasterxml.jackson.datatype.jsr310.JavaTimeModule]: Unresolvable class definition; nested exception is java.lang.NoClassDefFoundError: com/fasterxml/jackson/databind/ser/std/ToStringSerializerBase
	at org.springframework.beans.BeanUtils.instantiateClass(BeanUtils.java:157)
Caused by: java.lang.NoClassDefFoundError: com/fasterxml/jackson/databind/ser/std/ToStringSerializerBase


Caused by: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'requestMappingHandlerAdapter' defined in class path resource [org/springframework/boot/autoconfigure/web/servlet/WebMvcAutoConfiguration$EnableWebMvcConfiguration.class]: Bean instantiation via factory method failed; nested exception is org.springframework.beans.BeanInstantiationException: Failed to instantiate [org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter]: Factory method 'requestMappingHandlerAdapter' threw exception; nested exception is org.springframework.beans.BeanInstantiationException: Failed to instantiate [com.fasterxml.jackson.datatype.jsr310.JavaTimeModule]: Unresolvable class definition; nested exception is java.lang.NoClassDefFoundError: com/fasterxml/jackson/databind/ser/std/ToStringSerializerBase

Caused by: org.springframework.beans.BeanInstantiationException: Failed to instantiate [org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter]: Factory method 'requestMappingHandlerAdapter' threw exception; nested exception is org.springframework.beans.BeanInstantiationException: Failed to instantiate [com.fasterxml.jackson.datatype.jsr310.JavaTimeModule]: Unresolvable class definition; nested exception is java.lang.NoClassDefFoundError: com/fasterxml/jackson/databind/ser/std/ToStringSerializerBase

java.lang.IllegalStateException: Failed to load ApplicationContext

	
Caused by: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'requestMappingHandlerAdapter' defined in class path resource [org/springframework/boot/autoconfigure/web/servlet/WebMvcAutoConfiguration$EnableWebMvcConfiguration.class]: Bean instantiation via factory method failed; nested exception is org.springframework.beans.BeanInstantiationException: Failed to instantiate [org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter]: Factory method 'requestMappingHandlerAdapter' threw exception; nested exception is org.springframework.beans.BeanInstantiationException: Failed to instantiate [com.fasterxml.jackson.datatype.jsr310.JavaTimeModule]: Unresolvable class definition; nested exception is java.lang.NoClassDefFoundError: com/fasterxml/jackson/databind/ser/std/ToStringSerializerBase
	org.springframework.test.context.cache.DefaultCacheAwareContextLoaderDelegate.loadContext(DefaultCacheAwareContextLoaderDelegate.java:124)
	... 25 more
Caused by: org.springframework.beans.BeanInstantiationException: Failed to instantiate [org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter]: Factory method 'requestMappingHandlerAdapter' threw exception; nested exception is org.springframework.beans.BeanInstantiationException: Failed to instantiate [com.fasterxml.jackson.datatype.jsr310.JavaTimeModule]: Unresolvable class definition; nested exception is java.lang.NoClassDefFoundError: com/fasterxml/jackson/databind/ser/std/ToStringSerializerBase
	
Caused by: org.springframework.beans.BeanInstantiationException: Failed to instantiate [com.fasterxml.jackson.datatype.jsr310.JavaTimeModule]: Unresolvable class definition; nested exception is java.lang.NoClassDefFoundError: com/fasterxml/jackson/databind/ser/std/ToStringSerializerBase
	at org.springframework.beans.BeanUtils.instantiateClass(BeanUtils.java:157)
	
Caused by: java.lang.ClassNotFoundException: com.fasterxml.jackson.databind.ser.std.ToStringSerializerBase

	... 73 more
```

大概有以下几点：

- 有的说是 `jackson jar包`版本低了 把版本修改了就行了
- 还有可能是`jar 包冲突了` 解决冲突也能行
- 还有可能是 兼容问题哈

```xml
<!--json-->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>fastjson</artifactId>
    <version>1.2.33</version>
</dependency>
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.9.0</version>
</dependency>
1234567891011
```

可以先都试一试哈，没有给大家找完全哈。

#### 解决

最后我找到的解决方式 就是因为这句话 `使Jackson支持JSR310标准`

然后最后导入了下面这个依赖：

```xml
<dependency>
    <groupId>com.fasterxml.jackson.datatype</groupId>
    <artifactId>jackson-datatype-jsr310</artifactId>
    <version>2.9.2</version>
</dependency>
```
