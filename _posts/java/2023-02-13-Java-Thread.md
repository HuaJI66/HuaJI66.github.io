---
layout: post
title: java中线程执行流程详解
subtitle: java学习笔记
categories: java
tags: [线程]
banner:
  video: null             # Video banner source
  loop: true              # Video loop
  volume: 0               # Video volume (100% is 1.0)
  start_at: 0             # Video start time
  image: /assets/images/banners/spy1.jpg    # Image banner source
--- 

## java中线程执行流程详解

![imgs](/assets/images/java/1405715-20200520162018024-1689465997.png)

### **0 前言**

当线程被创建并启动以后，它既不是一启动就进入了执行状态，也不是一直处于执行状态。在线程的生命周期中，它要经过 **新建（New）、就绪（Runnable）、运行（Running）、阻塞（Blocked）和死亡（Dead）5种状态**。尤其是当线程启动以后，它不可能一直"霸占"着CPU独自运行，所以CPU需要在多条线程之间切换，于是 **线程状态也会多次在运行、阻塞之间切换**。

线程状态转换关系

### **1 新建（New）状态**

当程序使用new关键字创建了一个线程之后，该线程就处于 **新建状态**，此时的线程情况如下：

1. **此时JVM为其分配内存，并初始化其成员变量的值**；
2. **此时线程对象没有表现出任何线程的动态特征**，程序也不会执行线程的线程执行体；

### **2 就绪（Runnable）状态**

当线程对象调用了start()方法之后，该线程处于 **就绪状态**。此时的线程情况如下：

1. 此时JVM会为其 **创建方法调用栈和程序计数器**；
2. 该状态的线程一直处于 **线程就绪队列**（尽管是采用队列形式，事实上，**把它称为可运行池而不是可运行队列**。因为CPU的调度不一定是按照先进先出的顺序来调度的），线程并没有开始运行；
3. 此时线程 **等待系统为其分配CPU时间片**，并不是说执行了start()方法就立即执行；

**调用start()方法与run()方法，对比如下：**

1. **调用start()方法来启动线程，系统会把该run()方法当成线程执行体来处理**。但如果直接调用线程对象的run()方法，则run()方法立即就会被执行，而且在run()方法返回之前其他线程无法并发执行。也就是说，**系统把线程对象当成一个普通对象，而run()方法也是一个普通方法，而不是线程执行体**；
2. 需要指出的是，调用了线程的run()方法之后，**该线程已经不再处于新建状态**，不要再次调用线程对象的start()方法。**只能对处于新建状态的线程调用start()方法，否则将引发IllegaIThreadStateExccption异常**；

**如何让子线程调用start()方法之后立即执行而非"等待执行"：**

程序可以使用Thread.sleep(1) 来让当前运行的线程（主线程）睡眠1毫秒，1毫秒就够了，**因为在这1毫秒内CPU不会空闲，它会去执行另一个处于就绪状态的线程，这样就可以让子线程立即开始执行**；

### **3 运行（Running）状态**

当CPU开始调度处于 **就绪状态** 的线程时，此时线程获得了CPU时间片才得以真正开始执行run()方法的线程执行体，则该线程处于 **运行状态**。

1. 如果计算机只有一个CPU，那么在任何时刻只有一个线程处于运行状态；
2. 如果在一个多处理器的机器上，将会有多个线程并行执行，处于运行状态；
3. 当线程数大于处理器数时，依然会存在多个线程在同一个CPU上轮换的现象；

处于运行状态的线程最为复杂，它 **不可能一直处于运行状态（除非它的线程执行体足够短，瞬间就执行结束了）**，线程在运行过程中需要被中断，**目的是使其他线程获得执行的机会，线程调度的细节取决于底层平台所采用的策略**。线程状态可能会变为 **阻塞状态、就绪状态和死亡状态**。比如：

1. 对于采用 **抢占式策略** 的系统而言，系统会给每个可执行的线程分配一个时间片来处理任务；当该时间片用完后，系统就会剥夺该线程所占用的资源，让其他线程获得执行的机会。线程就会又 **从运行状态变为就绪状态**，重新等待系统分配资源；
2. 对于采用 **协作式策略**的系统而言，只有当一个线程调用了它的yield()方法后才会放弃所占用的资源—**也就是必须由该线程主动放弃所占用的资源**，线程就会又 **从运行状态变为就绪状态**。

### **4 阻塞（Blocked）状态**

处于运行状态的线程在某些情况下，让出CPU并暂时停止自己的运行，进入 **阻塞状态**。

**当发生如下情况时，线程将会进入阻塞状态：**

1. **线程调用sleep()方法**，主动放弃所占用的处理器资源，暂时进入中断状态（**不会释放持有的对象锁**），时间到后等待系统分配CPU继续执行；
2. **线程调用一个阻塞式IO方法**，在该方法返回之前，该线程被阻塞；
3. **线程试图获得一个同步监视器**，但该同步监视器正被其他线程所持有;
4. **程序调用了线程的suspend方法将线程挂起**；
5. **线程调用wait**，等待notify/notifyAll唤醒时(会释放持有的对象锁)；

**阻塞状态分类：**

1. **等待阻塞**：运行状态中的 **线程执行wait()方法**，使本线程进入到等待阻塞状态；
2. **同步阻塞**：线程在 **获取synchronized同步锁失败**（因为锁被其它线程占用），它会进入到同步阻塞状态；
3. **其他阻塞**：通过调用线程的 **sleep()或join()或发出I/O请求** 时，线程会进入到阻塞状态。当 **sleep()状态超时、join()等待线程终止或者超时、或者I/O处理完毕** 时，线程重新转入就绪状态；

**在阻塞状态的线程只能进入就绪状态，无法直接进入运行状态**。而就绪和运行状态之间的转换通常不受程序控制，**而是由系统线程调度所决定**。当处于就绪状态的线程获得处理器资源时，该线程进入运行状态；**当处于运行状态的线程失去处理器资源时，该线程进入就绪状态**。

但有一个方法例外，**调用yield()方法可以让运行状态的线程转入就绪状态**。

**4.1 等待（WAITING）状态**

线程处于 **无限制等待状态**，等待一个特殊的事件来重新唤醒，如：

1. 通过wait()方法进行等待的线程等待一个notify()或者notifyAll()方法；
2. 通过join()方法进行等待的线程等待目标线程运行结束而唤醒；

以上两种一旦通过相关事件唤醒线程，线程就进入了 **就绪（RUNNABLE）状态** 继续运行。

**4.2 时限等待（TIMED_WAITING）状态**

线程进入了一个 **时限等待状态**，如：

**sleep(3000)**，等待3秒后线程重新进行 **就绪（RUNNABLE）状态** 继续运行。

### **5 死亡（Dead）状态**

线程会以如下3种方式结束，结束后就处于 **死亡状态**：

1. **run()或call()方法执行完成**，线程正常结束；
2. **线程抛出一个未捕获的Exception或Error**；
3. **直接调用该线程stop()方法来结束该线程**—该方法容易导致死锁，通常不推荐使用；

**处于死亡状态的线程对象也许是活的，但是，它已经不是一个单独执行的线程**。线程一旦死亡，就不能复生。 **如果在一个死去的线程上调用start()方法，会抛出java.lang.IllegalThreadStateException异常**。

**所以，需要注意的是：**

**一旦线程通过start()方法启动后就再也不能回到新建（NEW）状态，线程终止后也不能再回到就绪（RUNNABLE）状态**。

**5.1 终止（TERMINATED）状态**

线程执行完毕后，进入终止（TERMINATED）状态。

### **6 线程相关方法**

```java
public class Thread{

    // 线程的启动
    public void start();

    // 线程体
    public void run();

    // 已废弃
    public void stop();

    // 已废弃
    public void resume();

    // 已废弃
    public void suspend();

    // 在指定的毫秒数内让当前正在执行的线程休眠
    public static void sleep(long millis);

    // 同上，增加了纳秒参数
    public static void sleep(long millis, int nanos);

    // 测试线程是否处于活动状态
    public boolean isAlive();

    // 中断线程
    public void interrupt();

    // 测试线程是否已经中断
    public boolean isInterrupted();

    // 测试当前线程是否已经中断
    public static boolean interrupted();

    // 等待该线程终止
    public void join() throws InterruptedException;

    // 等待该线程终止的时间最长为 millis 毫秒
    public void join(long millis) throws InterruptedException;

    // 等待该线程终止的时间最长为 millis 毫秒 + nanos 纳秒
    public void join(long millis, int nanos) throws InterruptedException;
}
```



线程方法状态转换

**6.1 线程就绪、运行和死亡状态转换**

1. **就绪状态转换为运行状态**：此线程得到CPU资源；
2. **运行状态转换为就绪状态**：此线程主动调用yield()方法或在运行过程中失去CPU资源。
3. **运行状态转换为死亡状态**：此线程执行执行完毕或者发生了异常；

**注意：**

当调用线程中的yield()方法时，线程从运行状态转换为就绪状态，**但接下来CPU调度就绪状态中的那个线程具有一定的随机性**，因此，可能会出现A线程调用了yield()方法后，接下来CPU仍然调度了A线程的情况。

**6.2 run & start**

通过调用start启动线程，线程执行时会执行run方法中的代码。

1. **start()**：线程的启动；
2. **run()**：线程的执行体；

**6.3 sleep & yield**

**sleep()**：通过sleep(millis)使线程进入休眠一段时间，**该方法在指定的时间内无法被唤醒，同时也不会释放对象锁**；

**比如，我们想要使主线程每休眠100毫秒，然后再打印出数字：**



```java
/**
 * 可以明显看到打印的数字在时间上有些许的间隔
 */
public class Test1 {  
    public static void main(String[] args) throws InterruptedException {  
        for(int i=0;i<100;i++){  
            System.out.println("main"+i);  
            Thread.sleep(100);  
        }  
    }  
}
```



**注意如下几点问题：**

1. **sleep是静态方法，最好不要用Thread的实例对象调用它**，**因为它睡眠的始终是当前正在运行的线程，而不是调用它的线程对象**，**它只对正在运行状态的线程对象有效**。看下面的例子：



```java
public class Test1 {  
public static void main(String[] args) throws InterruptedException {  
　　　　System.out.println(Thread.currentThread().getName());  
　　　　MyThread myThread=new MyThread();  
　　　　myThread.start();  
　　　　// 这里sleep的就是main线程，而非myThread线程
　　　　myThread.sleep(1000);
　　　　Thread.sleep(10);  
　　　　for(int i=0;i<100;i++){  
　　　　　　System.out.println("main"+i);  
　　　　}  
　　}  
}  
```



 

1. Java线程调度是Java多线程的核心，只有良好的调度，才能充分发挥系统的性能，提高程序的执行效率。但是不管程序员怎么编写调度，只能最大限度的影响线程执行的次序，而不能做到精准控制。**因为使用sleep方法之后，线程是进入阻塞状态的，只有当睡眠的时间结束，才会重新进入到就绪状态，而就绪状态进入到运行状态，是由系统控制的，我们不可能精准的去干涉它**，所以如果调用Thread.sleep(1000)使得线程睡眠1秒，可能结果会大于1秒。



```java
public class Test1 {  
　　public static void main(String[] args) throws InterruptedException {  
　　　　new MyThread().start();  
　　　　new MyThread().start();  
　　}  
}  
class MyThread extends Thread {  
　　@Override  
　　public void run() {  
　　　　for (int i = 0; i < 3; i++) {  
　　　　　　System.out.println(this.getName()+"线程" + i + "次执行！");  
　　　　　　try {  
　　　　　　　　Thread.sleep(50);  
　　　　　　} catch (InterruptedException e) {  
　　　　　　　　e.printStackTrace();  
　　　　　　}  
　　　　}  
　　}  
}
```



**看某一次的运行结果**：可以发现，线程0首先执行，然后线程1执行一次，又了执行一次。发现并不是按照sleep的顺序执行的。

Thread-0线程0次执行！  

Thread-1线程0次执行！  

Thread-1线程1次执行！  

Thread-0线程1次执行！  

Thread-0线程2次执行！  

Thread-1线程2次执行！  

**yield()**：与sleep类似，**也是Thread类提供的一个静态的方法，它也可以让当前正在执行的线程暂停，让出CPU资源给其他的线程**。但是和sleep()方法不同的是，**它不会进入到阻塞状态，而是进入到就绪状态**。yield()方法只是让当前线程暂停一下，重新进入就绪线程池中，让系统的线程调度器重新调度器重新调度一次，完全可能出现这样的情况：**当某个线程调用yield()方法之后，线程调度器又将其调度出来重新进入到运行状态执行**。

实际上，**当某个线程调用了yield()方法暂停之后，优先级与当前线程相同，或者优先级比当前线程更高的就绪状态的线程更有可能获得执行的机会**，当然，只是有可能，因为我们不可能精确的干涉cpu调度线程。



```java
public class Test1 {  
    public static void main(String[] args) throws InterruptedException {  
        new MyThread("低级", 1).start();  
        new MyThread("中级", 5).start();  
        new MyThread("高级", 10).start();  
    }  
}  

class MyThread extends Thread {  
    public MyThread(String name, int pro) {  
        super(name);// 设置线程的名称  
        this.setPriority(pro);// 设置优先级  
    }  

    @Override  
    public void run() {  
        for (int i = 0; i < 30; i++) {  
            System.out.println(this.getName() + "线程第" + i + "次执行！");  
            if (i % 5 == 0)  
                Thread.yield();  
        }  
    }  
}  
```



**关于sleep()方法和yield()方的区别如下**：

1. sleep方法暂停当前线程后，**会进入阻塞状态**，只有当睡眠时间到了，**才会转入就绪状态**。而yield方法调用后 ，**是直接进入就绪状态**，所以有可能刚进入就绪状态，又被调度到运行状态；
2. **sleep方法声明抛出了InterruptedException**，所以调用sleep方法的时候要捕获该异常，或者显示声明抛出该异常。**而yield方法则没有声明抛出任务异常**；
3. sleep方法比yield方法有更好的可移植性，**通常不要依靠yield方法来控制并发线程的执行**；

**6.4 join**

线程的合并的含义就是 **将几个并行线程的线程合并为一个单线程执行**，应用场景是 **当一个线程必须等待另一个线程执行完毕才能执行时**，Thread类提供了join方法来完成这个功能，**注意，它不是静态方法**。

**join有3个重载的方法：**

void join()   

  当前线程等该加入该线程后面，等待该线程终止。  

void join(long millis)   

  当前线程等待该线程终止的时间最长为 millis 毫秒。 如果在millis时间内，该线程没有执行完，那么当前线程进入就绪状态，重新等待cpu调度  

void join(long millis,int nanos)   

  等待该线程终止的时间最长为 millis 毫秒 + nanos 纳秒。如果在millis时间内，该线程没有执行完，那么当前线程进入就绪状态，重新等待cpu调度

**例子代码，如下**：



```
/**
 * 在主线程中调用thread.join(); 就是将主线程加入到thread子线程后面等待执行。不过有时间限制，为1毫秒。
 */
public class Test1 {  
    public static void main(String[] args) throws InterruptedException {  
        MyThread t=new MyThread();  
        t.start();  
        t.join(1);//将主线程加入到子线程后面，不过如果子线程在1毫秒时间内没执行完，则主线程便不再等待它执行完，进入就绪状态，等待cpu调度  
        for(int i=0;i<30;i++){  
            System.out.println(Thread.currentThread().getName() + "线程第" + i + "次执行！");  
        }  
    }  
}  

class MyThread extends Thread {  
    @Override  
    public void run() {  
        for (int i = 0; i < 1000; i++) {  
            System.out.println(this.getName() + "线程第" + i + "次执行！");  
        }  
    }  
}  
```



**在JDK中join方法的源码，如下：**



```java
public final synchronized void join(long millis)    throws InterruptedException {  

    long base = System.currentTimeMillis();  
    long now = 0;  
    if (millis < 0) {  
        throw new IllegalArgumentException("timeout value is negative");  
    }  
    if (millis == 0) {  
        while (isAlive()) {  
           wait(0);  
        }  
    } else {  
        while (isAlive()) {  
            long delay = millis - now;  
            if (delay <= 0) {  
                break;  
            }  
            wait(delay);  
            now = System.currentTimeMillis() - base;  
        }  
    }  
}  
```



**join方法实现是通过调用wait方法实现**。当main线程调用t.join时候，**main线程会获得线程对象t的锁（wait 意味着拿到该对象的锁)，调用该对象的wait(等待时间)，直到该对象唤醒main线程**，比如退出后。**这就意味着main 线程调用t.join时，必须能够拿到线程t对象的锁**。

**6.5 suspend & resume (已过时)**

suspend-**线程进入阻塞状态，但不会释放锁**。此方法已不推荐使用，**因为同步时不会释放锁，会造成死锁的问题**。

resume-**使线程重新进入可执行状态**。

为什么 Thread.suspend 和 Thread.resume 被废弃了？

Thread.suspend 天生容易引起死锁。**如果目标线程挂起时在保护系统关键资源的监视器上持有锁，那么其他线程在目标线程恢复之前都无法访问这个资源。如果要恢复目标线程的线程在调用 resume 之前试图锁定这个监视器，死锁就发生了**。这种死锁一般自身表现为“冻结（ frozen ）”进程。

**其他相关资料：**

1. https://blog.csdn.net/dlite/article/details/4212915

**6.6 stop（已过时）**

**不推荐使用，且以后可能去除，因为它不安全**。为什么 Thread.stop 被废弃了？

因为其天生是不安全的。**停止一个线程会导致其解锁其上被锁定的所有监视器（监视器以在栈顶产生ThreadDeath异常的方式被解锁）**。如果之前被这些监视器保护的任何对象处于不一致状态，其它线程看到的这些对象就会处于不一致状态。**这种对象被称为受损的 （damaged）**。当线程在受损的对象上进行操作时，会导致任意行为。这种行为可能微妙且难以检测，也可能会比较明显。

**不像其他未受检的（unchecked）异常， ThreadDeath 悄无声息的杀死及其他线程**。因此，用户得不到程序可能会崩溃的警告。崩溃会在真正破坏发生后的任意时刻显现，甚至在数小时或数天之后。

**其他相关资料：**

1. https://blog.csdn.net/dlite/article/details/4212915

**6.7 wait & notify/notifyAll**

wait & notify/notifyAll这三个都是Object类的方法。使用 wait ，notify 和 notifyAll **前提是先获得调用对象的锁**。

1. 调用 wait 方法后，释放持有的对象锁，**线程状态有 Running 变为 Waiting**，并将当前线程放置到对象的 **等待队列**；
2. 调用notify 或者 notifyAll 方法后，**等待线程依旧不会从 wait 返回，需要调用 not****i****fy 的线程释放锁之后，等待线程才有机会从 wait 返回**；
3. notify 方法：**将等待队列的一个等待线程从等待队列种移到同步队列中** ，而 notifyAll 方法：**将等待队列种所有的线程全部移到同步队列，被移动的线程状态由 Waiting 变为 Blocked**。

前面一直提到两个概念，**等待队列（等待池），同步队列（锁池）**，这两者是不一样的。具体如下：

**同步队列（锁池）**：假设线程A已经拥有了某个对象（注意:不是类）的锁，而其它的线程想要调用这个对象的某个synchronized方法(或者synchronized块)，由于这些线程在进入对象的synchronized方法之前必须先获得该对象的锁的拥有权，但是该对象的锁目前正被线程A拥有，**所以这些线程就进入了该对象的同步队列（锁池）中，这些线程状态为Blocked**。

**等待队列（等待池）**：假设一个线程A调用了某个对象的wait()方法，线程A就会释放该对象的锁（因为wait()方法必须出现在synchronized中，这样自然在执行wait()方法之前线程A就已经拥有了该对象的锁），同时 **线程A就进入到了该对象的等待队列（等待池）中，此时线程A状态为Waiting**。如果另外的一个线程调用了相同对象的notifyAll()方法，那么 **处于该对象的等待池中的线程就会全部进入该对象的同步队列（锁池）中，准备争夺锁的拥有权**。如果另外的一个线程调用了相同对象的notify()方法，那么 **仅仅有一个处于该对象的等待池中的线程（随机）会进入该对象的同步队列（锁池）**。

**被notify或notifyAll唤起的线程是有规律的，具体如下：**

1. 如果是通过notify来唤起的线程，那 **先进入wait的线程会先被唤起来**；
2. 如果是通过nootifyAll唤起的线程，默认情况是 **最后进入的会先被唤起来**，即LIFO的策略；

**6.8 线程优先级**

每个线程执行时都有一个优先级的属性，**优先级高的线程可以获得较多的执行机会，而优先级低的线程则获得较少的执行机会**。与线程休眠类似，线程的优先级仍然无法保障线程的执行次序。只不过，**优先级高的线程获取CPU资源的概率较大，优先级低的也并非没机会执行**。

**每个线程默认的优先级都与创建它的父线程具有相同的优先级，在默认情况下，main线程具有普通优先级**；

Thread类提供了setPriority(int newPriority)和getPriority()方法来设置和返回一个指定线程的优先级，其中setPriority方法的参数是一个整数，范围是1~10之间，也可以使用Thread类提供的三个静态常量：

MAX_PRIORITY  =10

MIN_PRIORITY  =1

NORM_PRIORITY  =5

**例子代码，如下**：



```java
public class Test1 {  

    public static void main(String[] args) throws InterruptedException {  
        new MyThread("高级", 10).start();  
        new MyThread("低级", 1).start();  
    }  
}  

class MyThread extends Thread {  

    public MyThread(String name,int pro) {  
        super(name);//设置线程的名称  
        setPriority(pro);//设置线程的优先级  
    }  

    @Override  
    public void run() {  
        for (int i = 0; i < 100; i++) {  
            System.out.println(this.getName() + "线程第" + i + "次执行！");  
        }  
    }  
}  
```



从执行结果可以看到 ，**一般情况下，高级线程更显执行完毕**。

**注意一点**：

虽然Java提供了10个优先级别，但这些优先级别需要操作系统的支持。**不同的操作系统的优先级并不相同，而且也不能很好的和Java的10个优先级别对应**。所以我们应该使用MAX_PRIORITY、MIN_PRIORITY和NORM_PRIORITY三个静态常量来设定优先级，**这样才能保证程序最好的可移植性**。

**6.9 守护线程**

守护线程与普通线程写法上基本没啥区别，**调用线程对象的方法setDaemon(true)**，则可以将其设置为守护线程。

守护线程使用的情况较少，但并非无用，举例来说，**JVM的垃圾回收、内存管理等线程都是守护线程**。还有就是在做数据库应用时候，使用的数据库连接池，**连接池本身也包含着很多后台线程，监控连接个数、超时时间、状态等等**。

**setDaemon方法详细说明**：

public final void setDaemon(boolean on)：将该线程标记为守护线程或用户线程。**当正在运行的线程都是守护线程时，Java 虚拟机退出**。

**该方法必须在启动线程前调用**。 该方法首先调用该线程的 checkAccess 方法，且不带任何参数。这可能抛出 SecurityException（在当前线程中）。

**参数：**

on - 如果为 true，则将该线程标记为守护线程。

**抛出：**

 IllegalThreadStateException - 如果该线程处于活动状态。

 SecurityException - 如果当前线程无法修改该线程。



```java
/**
* Java线程：线程的调度-守护线程
*/  

public class Test {  

        public static void main(String[] args) {  
                Thread t1 = new MyCommon();  
                Thread t2 = new Thread(new MyDaemon());  
                t2.setDaemon(true);        //设置为守护线程  
                t2.start();  
                t1.start();  
        }  
}  

class MyCommon extends Thread {  
        public void run() {  
                for (int i = 0; i < 5; i++) {  
                        System.out.println("线程1第" + i + "次执行！");  
                        try {  
                                Thread.sleep(7);  
                        } catch (InterruptedException e) {  
                                e.printStackTrace();  
                        }  
                }  
        }  
}  

class MyDaemon implements Runnable {  
        public void run() {  
                for (long i = 0; i < 9999999L; i++) {  
                        System.out.println("后台线程第" + i + "次执行！");  
                        try {  
                                Thread.sleep(7);  
                        } catch (InterruptedException e) {  
                                e.printStackTrace();  
                        }  
                }  
        }  
}  
```



执行结果：

后台线程第0次执行！  

线程1第0次执行！  

线程1第1次执行！  

后台线程第1次执行！  

后台线程第2次执行！  

线程1第2次执行！  

线程1第3次执行！  

后台线程第3次执行！  

线程1第4次执行！  

后台线程第4次执行！  

后台线程第5次执行！  

后台线程第6次执行！  

后台线程第7次执行！

从上面的执行结果可以看出：**前台线程是保证执行完毕的，后台线程还没有执行完毕就退出了**。

实际上：**JRE判断程序是否执行结束的标准是所有的前台执线程行完毕了，而不管后台线程的状态，因此，在使用后台线程时候一定要注意这个问题**。

**6.10 如何结束一个线程**

**Thread.stop()、Thread.suspend、Thread.resume、Runtime.runFinalizersOnExit** 这些终止线程运行的方法已经被废弃了，使用它们是极端不安全的！想要安全有效的结束一个线程，可以使用下面的方法。

1. 正常执行完run方法，然后结束掉；
2. 控制循环条件和判断条件的标识符来结束掉线程；

**比如run方法这样写**：只要保证在一定的情况下，run方法能够执行完毕即可。而不是while(true)的无限循环。



```java
class MyThread extends Thread {  
    int i=0;  
    @Override  
    public void run() {  
        while (true) {  
            if(i==10)  
                break;  
            i++;  
            System.out.println(i);  
        }  
    }  
}  
```



或者



```java
class MyThread extends Thread {  

    int i=0;  
    boolean next=true;  
    @Override  
    public void run() {  
        while (next) {  
            if(i==10)  
                next=false;  
            i++;  
            System.out.println(i);  
        }  
    }  
}  
```



或者



```java
class MyThread extends Thread {  

    int i=0;  
    @Override  
    public void run() {  
        while (true) {  
            if(i==10)  
                return;  
            i++;  
            System.out.println(i);  
        }  
    }  
}  
```



诚然，使用上面方法的标识符来结束一个线程，是一个不错的方法，但其也有弊端，如果 **该线程是处于sleep、wait、join的状态时候，while循环就不会执行**，那么我们的标识符就无用武之地了，**当然也不能再通过它来结束处于这3种状态的线程了**。

**所以，此时可以使用interrupt这个巧妙的方式结束掉这个线程**。我们先来看看sleep、wait、join方法的声明：

public final void wait() throws InterruptedException

public static native void sleep(long millis) throws InterruptedException

public final void join() throws InterruptedException

可以看到，这三者有一个共同点，都抛出了一个InterruptedException的异常。**在什么时候会产生这样一个异常呢**？

**每个Thread都有一个中断状状态，默认为false**。可以通过Thread对象的isInterrupted()方法来判断该线程的中断状态。可以通过Thread对象的interrupt()方法将中断状态设置为true。

当一个线程处于sleep、wait、join这三种状态之一的时候，**如果此时他的中断状态为true，那么它就会抛出一个InterruptedException的异常**，并将中断状态重新设置为false。

看下面的简单的例子：



```java
public class Test1 {  

    public static void main(String[] args) throws InterruptedException {  
        MyThread thread=new MyThread();  
        thread.start();  
    }  
}  

class MyThread extends Thread {  

    int i=1;  
    @Override  
    public void run() {  
        while (true) {  
            System.out.println(i);  
            System.out.println(this.isInterrupted());  
            try {  
                System.out.println("我马上去sleep了");  
                Thread.sleep(2000);  
                this.interrupt();  
            } catch (InterruptedException e) {  
                System.out.println("异常捕获了"+this.isInterrupted());  
                return;  
            }  
            i++;  
        }  
    }  
}  
```



测试结果：

1  

false  

我马上去sleep了  

2  

true  

我马上去sleep了  

异常捕获了false

可以看到，首先执行第一次while循环，在第一次循环中，睡眠2秒，然后将中断状态设置为true。**当进入到第二次循环的时候，中断状态就是第一次设置的true，当它再次进入sleep的时候，马上就抛出了InterruptedException异常，然后被我们捕获了**。然后中断状态又被重新自动设置为false了（从最后一条输出可以看出来）。

所以，我们可以使用interrupt方法结束一个线程。具体使用如下：



```java
public class Test1 {  

    public static void main(String[] args) throws InterruptedException {  
        MyThread thread=new MyThread();  
        thread.start();  
        Thread.sleep(3000);  
        thread.interrupt();  
    }  
}  

class MyThread extends Thread {  

    int i=0;  
    @Override  
    public void run() {  
        while (true) {  
            System.out.println(i);  
            try {  
                Thread.sleep(1000);  
            } catch (InterruptedException e) {  
                System.out.println("中断异常被捕获了");  
                return;  
            }  
            i++;  
        }  
    }  
}
```



多测试几次，会发现一般有两种执行结果：

0  

1  

2  

中断异常被捕获了

或者

0  

1  

2  

3  

中断异常被捕获了

这两种结果恰恰说明了，**只要一个线程的中断状态一旦为true，只要它进入sleep等状态，或者处于sleep状态，立马回抛出InterruptedException异常**。

**第一种情况**，是当主线程从3秒睡眠状态醒来之后，调用了子线程的interrupt方法，此时子线程正处于sleep状态，立马抛出InterruptedException异常。

**第二种情况**，是当主线程从3秒睡眠状态醒来之后，调用了子线程的interrupt方法，此时子线程还没有处于sleep状态。然后再第3次while循环的时候，在此进入sleep状态，立马抛出InterruptedException异常。

# ThreadLocal

### 1. ThreadLocal是什么？

从名字我们就可以看到`ThreadLocal` 叫做本地线程变量，意思是说，`ThreadLocal` 中填充的的是当前线程的变量，该变量对其他线程而言是封闭且隔离的，`ThreadLocal` 为变量在每个线程中创建了一个副本，这样每个线程都可以访问自己内部的副本变量。

从字面意思很容易理解，但是实际角度就没那么容易了，作为一个面试常问的点，使用场景也是很丰富。

- 1、在进行对象跨层传递的时候，使用ThreadLocal可以避免多次传递，打破层次间的约束。
- 2、线程间数据隔离
- 3、进行事务操作，用于存储线程事务信息。
- 4、数据库连接，`Session`会话管理。

现在相信你已经对`ThreadLocal`有一个大致的认识了，下面我们看看如何用？

### 2. ThreadLocal怎么用？

下面让我们来看一个例子：

```text
public class ThreadLocalTest02 {

    public static void main(String[] args) {

        ThreadLocal<String> local = new ThreadLocal<>();

        IntStream.range(0, 10).forEach(i -> new Thread(() -> {
            local.set(Thread.currentThread().getName() + ":" + i);
            System.out.println("线程：" + Thread.currentThread().getName() + ",local:" + local.get());
        }).start());
    }
}

输出结果：
线程：Thread-0,local:Thread-0:0
线程：Thread-1,local:Thread-1:1
线程：Thread-2,local:Thread-2:2
线程：Thread-3,local:Thread-3:3
线程：Thread-4,local:Thread-4:4
线程：Thread-5,local:Thread-5:5
线程：Thread-6,local:Thread-6:6
线程：Thread-7,local:Thread-7:7
线程：Thread-8,local:Thread-8:8
线程：Thread-9,local:Thread-9:9
```

从结果可以看到，每一个线程都有自己的local 值，这就是TheadLocal的基本使用 。

下面我们从源码的角度来分析一下，ThreadLocal的工作原理。

### 3. ThreadLocal源码分析

1、`set` 方法

```text
/**
     * Sets the current thread's copy of this thread-local variable
     * to the specified value.  Most subclasses will have no need to
     * override this method, relying solely on the {@link #initialValue}
     * method to set the values of thread-locals.
     *
     * @param value the value to be stored in the current thread's copy of
     *        this thread-local.
     */
    public void set(T value) {
        //首先获取当前线程对象
        Thread t = Thread.currentThread();
        //获取线程中变量 ThreadLocal.ThreadLocalMap
        ThreadLocalMap map = getMap(t);
        //如果不为空，
        if (map != null)
            map.set(this, value);
        else
            //如果为空，初始化该线程对象的map变量，其中key 为当前的threadlocal 变量
            createMap(t, value);
    }

    /**
     * Create the map associated with a ThreadLocal. Overridden in
     * InheritableThreadLocal.
     *
     * @param t the current thread
     * @param firstValue value for the initial entry of the map
     */
//初始化线程内部变量 threadLocals ，key 为当前 threadlocal
    void createMap(Thread t, T firstValue) {
        t.threadLocals = new ThreadLocalMap(this, firstValue);
    }

       /**
         * Construct a new map initially containing (firstKey, firstValue).
         * ThreadLocalMaps are constructed lazily, so we only create
         * one when we have at least one entry to put in it.
         */
        ThreadLocalMap(ThreadLocal<?> firstKey, Object firstValue) {
            table = new Entry[INITIAL_CAPACITY];
            int i = firstKey.threadLocalHashCode & (INITIAL_CAPACITY - 1);
            table[i] = new Entry(firstKey, firstValue);
            size = 1;
            setThreshold(INITIAL_CAPACITY);
        }


 static class Entry extends WeakReference<ThreadLocal<?>> {
            /** The value associated with this ThreadLocal. */
            Object value;

            Entry(ThreadLocal<?> k, Object v) {
                super(k);
                value = v;
            }
        }
```

汇总下，`ThreadLocalMap` 为 `ThreadLocal` 的一个静态内部类，里面定义了`Entry` 来保存数据。而且是继承的弱引用。在`Entry`内部使用`ThreadLocal`作为`key`，使用我们设置的`value`作为`value`。

对于每个线程内部有个`ThreadLocal.ThreadLocalMap` 变量，存取值的时候，也是从这个容器中来获取。

2、`get`方法

```text
/**
     * Returns the value in the current thread's copy of this
     * thread-local variable.  If the variable has no value for the
     * current thread, it is first initialized to the value returned
     * by an invocation of the {@link #initialValue} method.
     *
     * @return the current thread's value of this thread-local
     */
    public T get() {
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null) {
            ThreadLocalMap.Entry e = map.getEntry(this);
            if (e != null) {
                @SuppressWarnings("unchecked")
                T result = (T)e.value;
                return result;
            }
        }
        return setInitialValue();
    }
```

通过上面的分析，相信你对该方法已经有所理解了，首先获取当前线程，然后通过`key threadlocal` 获取 设置的`value` 。

### 4. ThreadLocal 内存泄漏问题

我们首先来看下，下面这个类：

```text
/**
         * The entries in this hash map extend WeakReference, using
         * its main ref field as the key (which is always a
         * ThreadLocal object).  Note that null keys (i.e. entry.get()
         * == null) mean that the key is no longer referenced, so the
         * entry can be expunged from table.  Such entries are referred to
         * as "stale entries" in the code that follows.
         */
        static class Entry extends WeakReference<ThreadLocal<?>> {
            /** The value associated with this ThreadLocal. */
            Object value;

            Entry(ThreadLocal<?> k, Object v) {
                super(k);
                value = v;
            }
        }
```

注释说的很清楚了，`Note that null keys (i.e. entry.get()* == null)`

如果 `key threadlocal` 为 `null` 了，这个 `entry` 就可以清除了。

`ThreadLocal`是一个弱引用，当为`null`时，会被当成垃圾回收 。



![img](/assets/images/java/v2-50b25a5f65fe02d6eebe27801a94c833_r.jpg)

**重点来了，突然我们ThreadLocal是null了，也就是要被垃圾回收器回收了，但是此时我们的ThreadLocalMap（thread 的内部属性）生命周期和Thread的一样，它不会回收，这时候就出现了一个现象。那就是ThreadLocalMap的key没了，但是value还在，这就造成了内存泄漏。**

解决办法：使用完`ThreadLocal`后，执行`remove`操作，避免出现内存溢出情况。

所以 如同 `lock` 的操作 最后要执行解锁操作一样，`ThreadLocal`使用完毕一定记得执行remove 方法，清除当前线程的数值。

如果不`remove` 当前线程对应的`VALUE` ,就会一直存在这个值。

使用了线程池，可以达到“线程复用”的效果。但是归还线程之前记得清除`ThreadLocalMap`，要不然再取出该线程的时候，`ThreadLocal`变量还会存在。这就不仅仅是内存泄露的问题了，整个业务逻辑都可能会出错。

### 5. 为什么key使用弱引用？

如果使用强引用，当`ThreadLocal` 对象的引用（强引用）被回收了，`ThreadLocalMap`本身依然还持有`ThreadLocal`的强引用，如果没有手动删除这个key ,则`ThreadLocal`不会被回收，所以只要当前线程不消亡，`ThreadLocalMap`引用的那些对象就不会被回收， 可以认为这导致`Entry`内存泄漏。

附：强引用-软引用-弱引用

- 强引用：普通的引用，强引用指向的对象不会被回收；
- 软引用：仅有软引用指向的对象，只有发生gc且内存不足，才会被回收；
- 弱引用：仅有弱引用指向的对象，只要发生gc就会被回收。
