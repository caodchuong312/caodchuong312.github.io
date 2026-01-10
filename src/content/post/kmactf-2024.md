---
title: Writeup KMACTF 2024 - Web
description: KMA CTF tổ chức hằng năm
tags:
  - Security
pubDate: 2024-08-27
---

## pickleball

![](https://hackmd.io/_uploads/HyfZQ2FjC.png)

Bài này flag được chia làm 3 phần
- Phần 1: nằm trong `/robots.txt`:

![](https://hackmd.io/_uploads/S1HuQ2FjA.png)

>KMACTF{p1Ckleb4ll_

- Phần 2: nằm trong file js: `/assets/index-f7659d98.js`

![](https://hackmd.io/_uploads/H11JVhKiC.png)


>WitH-uU_

- Phần 3: nằm trong file css: `/assets/index-e2ac387f.css`

![](https://hackmd.io/_uploads/H1YmN3KsR.png)

>piCklepal_5a6b89113abb}

=> Kết hợp lại được flag hoàn chỉnh: `KMACTF{p1Ckleb4ll_WitH-uU_piCklepal_5a6b89113abb}`

## malicip

![](https://hackmd.io/_uploads/BysdV2Yo0.png)

Bài nhau cho source code, đọc lướt qua biết được flag nằm trong database theo file `db/schema.sql`:

![](https://hackmd.io/_uploads/Syj4r3toC.png)

Đi vào file `web/src/app/app.py`, thấy được 2 endpoint dính lỗ hổng SQLi:

![](https://hackmd.io/_uploads/SkkS8hYiR.png)

Tuy nhiên các params đều được check theo kiểu dữ liệu như `/list-ip` là `int` và `/check-ip` là `ip_address`. Việc inject chỉ dùng `int` hay bypass nó khá khó, cũng như theo đề bài thì mình tập trung vào cái thứ 2.
Bây giờ đi tìm cách injection bằng cách đi vào chúng.

### ipaddress
Trong `ipaddress.ip_address` được validate theo 2 dạng IPv4 và IPv6:

![](https://hackmd.io/_uploads/BJpkd2YjR.png)

- IPv4:

![](https://hackmd.io/_uploads/Hybhunts0.png)

address truyền vào được kiểm tra dạng `int`, `byte` hay `string` để check từng loại, vì loại string là khả quan nhất nên đi vào `_ip_int_from_string()`:

![](https://hackmd.io/_uploads/r1cb9htoA.png)

Dựa vào `.` để split rồi chuyển sang int và tiếp tục xử lý qua `_parse_octet`, trong đây thì cũng không làm được gì khác và mình chuyển sang IPv6.

- IPv6:
Tương tự vậy:

![](https://hackmd.io/_uploads/H1rSA3FoA.png)

Trước khi đưa vào `_ip_int_from_string()` thì nó được qua `_split_scope_id` để phân tách dựa vào `%`:

![](https://hackmd.io/_uploads/SJiAA3YiR.png)
 
 Ví dụ với `fe80::1%eth0` thì `addr` `fe80::1` và `scope_id` `eth0`
 
 ![](https://hackmd.io/_uploads/By_mJTKjR.png)

Và đến đây nhận thấy nó chỉ check cái `addr` chứ không check cái `scope_id` phía sau. 

### Khai thác SQLi

![](https://hackmd.io/_uploads/Bkvelpti0.png)


- Lấy tên table: `fe80::1%'+union+select+1,gRoUp_cOncaT(0x7c,table_name,0x7C)+fRoM+information_schema.tables+wHeRe+table_schema='malicip'--+`

![](https://hackmd.io/_uploads/r119epKjR.png)

Kết quả: `______________________________________________m4LiC10u5_T413Le`

- Lấy tên column:
`fe80::1%'+union+select+1,column_name+from+information_schema.columns+where+table_name='______________________________________________m4LiC10u5_T413Le'--+`

![](https://hackmd.io/_uploads/ByHFWaYsR.png)


Kết quả: `_____________________________________________MaL1ci0uS_c0lUmnN`

- Lấy flag:
`fe80::1%'+union+select+1,_____________________________________________MaL1ci0uS_c0lUmnN+from+______________________________________________m4LiC10u5_T413Le--+`

![](https://hackmd.io/_uploads/ryf3ZaFs0.png)

>Flag: `KMACTF{actually__this_flag-is_not_so_malicious_but_the_ipv6_is}`


## Spring Up

![](https://hackmd.io/_uploads/HyDSGptoA.png)

Đây là ứng dụng viết bằng spring, đầu tiền add lib trên IntelliJ IDEA để xem file `jar`


![](https://hackmd.io/_uploads/ryBgSpKoA.png)

![](https://hackmd.io/_uploads/rJcQHatiC.png)


Theo Dockerfile, để lấy flag thì phải RCE:

![](https://hackmd.io/_uploads/S1hZrTYsR.png)

Chạy docker:

![](https://hackmd.io/_uploads/BJBy8aFiA.png)

Tại class `io.devme4f.springup.FileController` ứng với mapping `/file`:

Có 3 endpoint:

- `@GetMapping({"testUI"})`: giao diện upload file

    ![](https://hackmd.io/_uploads/H1te5TtjA.png)

- `@PostMapping({"uploadResource"})`: dùng để upload và xử lý file.
- `@GetMapping({"downloadResource"})`: dùng để đọc file.


### [GET] /file/downloadResource
Tại đây nhận vào param `fileName` được nối trực tiếp với `"uploads/"` và đưa vào:

![](https://hackmd.io/_uploads/rJvPD6YsC.png)

Điều này xảy ra lỗ hổng đọc file bất kỳ.

![](https://hackmd.io/_uploads/Skc3wptiA.png)

Tuy nhiên mình đọc thử file vài file trên server nhưng cũng không thu được thông tin gì đáng kể.

### [POST] /file/uploadResource
Tiếp tực với `uploadResource`, có thể upload bất kỳ file gì vì không có filter nội dung hay extension mà chỉ là tên file dựa vào `BLACK_LIST`:

![](https://hackmd.io/_uploads/HJpssTYo0.png)


![](https://hackmd.io/_uploads/HJbpopKjC.png)

Có vẻ như author không muốn upload file `bash`, `sh` để thực thi lệnh cũng như upload vào các folder `etc` , `var`, `proc`, `cron` để có thể làm 1 điều gì đó🙄.
Bên cạnh đó tiếp tục lỗ hổng Path traversal để ghi file vào thư mục bất kỳ:

![](https://hackmd.io/_uploads/HJ-u36FiC.png)

Test:

![](https://hackmd.io/_uploads/rJ4X0TFsR.png)

![](https://hackmd.io/_uploads/B1GSCatiC.png)

Lúc test thì mình nhận thấy file có thể ghi đè được cũng nảy sinh được nhiều ý tưởng mới nhưng cũng chẳng làm được gì. Up webshell thì nó cũng không thực thi hay gọi ở bất kỳ đâu hay override các init scripts thực thi khi chạy service nào đó nhưng cũng đã bị filter,...
Sau 1 hồi thì mình tìm thấy [repo này](https://github.com/LandGrey/spring-boot-upload-file-lead-to-rce-tricks) kèm với đó là [bài viết](https://landgrey.me/blog/22/).
Ý tưởng bài viết trên là ghi file trong JDK HOME, tuy nhiên không phải tất cả file jar đều tự động được load ngay mà qua việc `Opened` để đọc bytecode đưa vào bộ nhớ và sau đó `Loaded` để load chúng và sử dụng. Việc bây giờ là tìm file jar chưa được opened và theo bài viết là `charsets.jar` hoặc có thể file khác nữa.
`Charset.forName("GBK")` không được sử dụng và nó sẽ load `charsets.jar`

Như vậy request trigger:
```
GET / HTTP/1.1
Accept: text/html;charset=GBK
```

![](https://hackmd.io/_uploads/rySvBAqj0.png)

### Exploit

Về việc build file jar thì:
Từ file `charsets.jar` kia dùng extract nó ra `jar -xvf charsets.jar`, tạo project có package tương tự vậy (hoặc lấy sẵn trong repo kia):

![](https://hackmd.io/_uploads/HykiE39j0.png)
Và sửa command RCE trong class `IBM33722`:

![](https://hackmd.io/_uploads/rJEsAocsC.png)
>Chỗ này thì mình đưa flag vào trong `/tmp` vì thấy không có outbound và cũng đồng thời kết hợp với lỗ hổng đọc file chưa dùng đến.

Complile được 2 file .class mới:

![](https://hackmd.io/_uploads/HkQwrncoA.png)

![](https://hackmd.io/_uploads/r1PDH2csA.png)
Và replace 2 file cũ và thực hiện compress lại: `jar -cvmf META-INF/MANIFEST.MF charsets.jar ./*`
Upload file:
![](https://hackmd.io/_uploads/r1Vzb2csR.png)


Request trigger:

![](https://hackmd.io/_uploads/Hk9Txn5oA.png)

Có thể thấy trong log:
![](https://hackmd.io/_uploads/Hk9Kencs0.png)

Khi thực hiện lại request sẽ biết nó không load lại file jar, như vậy nó chỉ load 1 lần để dùng.
Kết quả:

![](https://hackmd.io/_uploads/SJT7l3ciC.png)


Bây giờ chỉ việc thực hiện trên server thật và lấy flag:

![](https://hackmd.io/_uploads/rkkaMnqoA.png)

>Flag: `KMACTF{ayoooo00oo0ooo0o0o00o0ooooo000oo0oo0o00000}`
