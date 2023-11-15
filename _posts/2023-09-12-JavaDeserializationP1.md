---
title: Lỗ hổng Java Deserialization - Phần 1 - Cơ bản về Java Deserialization
date: 2023-09-12 00:15:00 +0700
categories: [Java]
tags: [deserialization]     # TAG names should always be lowercase
img_path: /assets/img/JavaDeserializationP1
---

## Serialization và Deserialization
Trong Java, các object sẽ được lưu trữ vào bộ nhớ **heap** trong `JVM`. Vì vậy khi chương trình kết thúc tức là `JVM` dừng cũng có nghĩa là các object này sẽ bị mất. Vì vậy để có thể sử dụng lại object cũng như việc lưu trữ chúng hay việc chuyển chúng qua network thì cần có đến 2 quá trình **serialization** và **deserialization**.
- **Serialization**: Đây là cơ chế chuyển object sang dạng byte stream (mảng byte)
- **Deserialization**: Quá trình này ngược lại với trên là chuyển từ byte stream sang object.

![Deserialization](1.png)

### InputStream và OutputStream
#### Stream
Stream được định nghĩa là một chuỗi dữ liệu, nó có 2 loại:
- **Byte Streams**: cung cấp cách xử lý input và output của byte.
- **Character Stream**: cũng như vậy nhưng dạng ký tự.

Ở đây ta sẽ tập trung vào **Byte Streams**.<br>
Để thuận tiện cho việc xử lý thì nó được chia tiếp thành 2 loại:
- **InputStream**
- **OutputStrem**

Cả 2 đều là `abstract class` trong package `java.io`, vì vậy không thể tạo object từ đó mà phải thông qua các class kế thừa.


|  | InputStream          | OutputStrem |
|:-----------------------------|:-----------------|--------|
| Xử lý dữ liệu về | Input     | Output |
| Class kế thừa |  `FileInputStream`<br>`ByteArrayInputStream`<br>`ObjectInputStream`<br>`BufferedInputStream` |  `FileOutputStream`<br>`ByteArrayOutputStream`<br>`ObjectOutputStream`<br>`BufferedOutputStream`      |
| Một số method phổ biến | `read()`: Đọc 1 byte dữ liệu từ input stream và trả về giá trị byte đọc. Trả về `-1` nếu đã đọc hết.<br>`read(byte[] array)`: Đọc 1 mảng byte từ input stream và lưu vào mảng, nó trả về số byte thực sự đã đọc vào mảng hoặc `-1` nếu đã đọc hết.<br>`read(byte b[], int off, int len)`: Đọc một phần của mảng byte vào stream, từ vị trí `off` đến `off + len`.<br>`skips(long n)`: bỏ qua và giải phóng `n` byte từ input stream<br>`close()`: Đóng input stream và giải phóng bất kỳ tài nguyên liên quan. |`write(int b)`: Ghi một byte dữ liệu vào stream.<br>-`write(byte[] b)`: Ghi 1 mảng byte dữ liệu vào stream.<br>`write(byte[] b, int off, int len)`: Ghi một phần của mảng byte vào stream, từ vị trí `off` đến `off + len`.<br>`flush()`: Đẩy tất cả dữ liệu đã được ghi từ bộ đệm xuống luồng, nhưng không đóng luồng.<br>`close()`:Đóng output stream và giải phóng bất kỳ tài nguyên|


### **Ví dụ**

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
{: .prompt-tip }

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
    System.out.println(obj.toString()); //Kiểm tra do trong class Person có định nghĩa toString()
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
Cũng như các lỗ hổng Deserialization ở các ngôn ngữ khác như PHP, Python,... thì trong Java nó cũng xuất phát từ `untrusted data` nghĩa là thực hiện quá trình Deserialization bằng từ 1 serialized data kiểm soát bởi người dùng.<br>
Trong ví dụ trên nhìn vào cuối serialized data có từ `chuong` đó là giá trị trường `name`, nếu ta dùng hex editor để thay đổi giá trị chúng sang `admin` đồng thời thay đổi length của nó từ `0006` thành `0005`:

![example](xxd.png)

 Và khi quá trình deserialization vẫn thực hiện với file đó thì kết quả sẽ là:

 ![example1](ex.png)

Tất nhiên không chỉ vậy, kẻ tấn công còn có thể thực thi code hay command. Để giải thích điều này, ta cần biết đến khái niệm về `gadgets` - đây là class hoặc hàm có sẵn code thực thi trong process bị dễ tấn công. Việc thự thi đoạn code đó 
