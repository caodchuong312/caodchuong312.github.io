---
title: Java Deserialize Vulnerability - Phần 1 - Cơ bản về Java Deserialization
categories: [Java]
tags: [deserialization]     # TAG names should always be lowercase
img_path: /assets/img/JavaDeserializationP1
---

## Serialization và Deserialization
Trong Java, các object sẽ được lưu trữ vào bộ nhớ **heap** trong `JVM`. Vì vậy khi chương trình kết thúc tức là `JVM` dừng cũng có nghĩa là các object này sẽ bị mất. Vì vậy để có thể sử dụng lại object cũng như việc lưu trữ chúng hay việc chuyển chúng qua network thì cần có đến 2 quá trình **serialization** và **deserialization**.
- **Serialization**: Đây là cơ chế chuyển object sang dạng byte stream (mảng byte)
- **Deserialization**: Quá trình này ngược lại với trên là chuyển từ byte stream sang object.

![Deserialization](1.png)

## Quá trình Serialization/Deserialization trong Java
Ta có 1 class `Person`:
```java
import java.io.Serializable;

public class Person implements Serializable {
    private String name;
    private int age;
    public Person(){}
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public int getAge() {
        return age;
    }
    public void setAge(int age) {
        this.age = age;
    }
    @Override
    public String toString() {
        return "Person{" +
                "name='" + name + '\'' +
                ", age=" + age +
                '}';
    }
}
```

> `Serializable` là 1 `marker interface`. Nó không có bất kỳ field hay method nào. Mục đích của nó là việc instance tạo từ class được đánh dấu có thể được `serialized` cũng như `deserialized`.

Từ class `Person` trên ta tạo 1 object với tên `person` với các thuộc tính như sau:
```java
Person person = new Person("chuong", 19);
```
Bây giờ ta cần save object này (tức là serialize nó) bằng cách sử dụng:
- `FileOutputStream`: Đây là class ghi dữ liệu vào file (ở đây là mảng byte sau khi serialize).
- `ObjectInputStream.writeObject()`: Đây là method dùng để ghi object đến output stream.

```java
try {
    FileOutputStream file = new FileOutputStream("person.ser");
    ObjectOutputStream out = new ObjectOutputStream(file);
    out.writeObject(person);
    out.close();
    file.close();
} catch (Exception e) {
    e.printStackTrace();
}
```
Đoạn code trên đã lưu byte stream của object `person` sau khi serialize vào file `person.ser`, bây giờ từ file đó ta thực hiện deserialize để tạo lại object bằng cách sử dụng:
- `FileInputStream`: Đây là class đọc byte từ 1 file.
- `ObjectInputStream.readObject()`: Đây là method dùng để đọc object từ input stream.

```java
try {
    FileInputStream file = new FileInputStream("person.ser");
    ObjectInputStream in = new ObjectInputStream(file);
    Object obj = in.readObject();
    in.close();
    file.close();
    
    System.out.println(obj.toString());//Kiểm tra do trong class person có sử dụng toString()
} catch (Exception e) {
    e.printStackTrace();
}
```

Output:

![output](output.png)

Như vậy là quá trình deserialization đã tạo được lại object.

## Format của serialized data (byte stream)

![format](format.png)

> Header của serialized data này bao gồm `aced` là `STREAM_MAGIC` định dạng của data còn `0005` là `STREAM_VERSION` (versione của stream).<br>
> Ngoài ra các hằng số này và 1 số nữa được định nghĩa trong interface <a href="https://docs.oracle.com/javase/8/docs/api/java/io/ObjectStreamConstants.html">ObjectStreamConstants</a>.<br>
> Ví dụ như `7372` là `TC_OBJECT` (`73` là mã định danh trong serialization stream được sử dụng để đại diện cho một object cụ thể) và `TC_CLASSDESC` (`72` là một mã định danh trong serialization stream được sử dụng để đại diện cho class descriptor)<br>
> `serialVersionUID` là 1 mã định danh duy nhất cho mỗi class. `JVM` sử dụng nó để so sánh các phiên bản của class để đảm bảo rằng cùng một class đã được sử dụng trong quá trình Serialization được loaded trong quá trình Deserialization. Nếu người nhận đã load một class cho đối tượng có `serialVersionUID` khác với class của người gửi tương ứng thì quá trình Deserialization sẽ dẫn đến exception `InvalidClassException`. Việc khai báo sẽ có sự kiểm soát hơn, mặc dù `JVM` sẽ tự tạo ra một giá trị nếu không khai báo nó. 

## Insecure Deserialization trong Java


