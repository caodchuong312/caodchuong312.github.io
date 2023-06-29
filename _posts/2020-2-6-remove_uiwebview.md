---
title: iOS 13去除UIWebView依赖
categories: [iOS]
tags: [note]
seo:
  date_modified: 2020-02-06 23:50:54 +0800
---

### 从iOS 13开始苹果将 UIWebview 列为过期API
目前提交到 App Store 会反馈以下邮件提示：
[https://developer.apple.com/documentation/uikit/uiwebview](https://developer.apple.com/documentation/uikit/uiwebview)

```
Dear Developer,

We identified one or more issues with a recent delivery for your app, "AppName" 1.0 (1). Your delivery was successful, but you may wish to correct the following issues in your next delivery:

ITMS-90809: Deprecated API Usage - Apple will stop accepting submissions of apps that use UIWebView APIs . See https://developer.apple.com/documentation/uikit/uiwebview for more information.

After you’ve corrected the issues, you can upload a new binary to App Store Connect.

Best regards,

The App Store Team
```

So, 只不过是个警告罢了, 不理他, 能拿我怎样

于是, 苹果在年底发了通告: [https://developer.apple.com/news/?id=12232019b](https://developer.apple.com/news/?id=12232019b):
![Apple News And Updates](https://raw.githubusercontent.com/vinsent/vinsent.github.io/master/assets/img/post/2020-2-6-remove_uiwebview/apple_news_about_webview.png)

重点在最后一句: The App Store will no longer accept new apps using UIWebView as of April 2020 and app updates using UIWebView as of December 2020.

ps: 你爸爸还是你爸爸 Apple: 赶紧给老子改!

默默打开工程: Cmd+Shirt+f, 搜索UIWebView, 替换成WKWebView.

OK, 这下应该万事大吉了, 提交新版本试试.
but, 又收到了90809警告, what fuck?

原来, 之前只是把项目中使用UIWebView的地方搜索出来了, 但是一些第三framework中并没有搜索得到

OK, 接下来, 看下哪些framework还在使用UIWebView, [stack overflow](https://stackoverflow.com/questions/57722616/itms-90809-deprecated-api-usage-apple-will-stop-accepting-submissions-of-app)

* 首先, cd 到App archive路径下	

	```
	 $ cd ~/Library/Developer/Xcode/Archives/<date>/myapp.xcarchive/Products/Applications/myapp.app	
	 
	```
 
* 然后使用下面的命令查找哪些framework在使用UIWebView(注意替换app名字)

	```
	nm myapp | grep UIWeb
	for framework in Frameworks/*.framework; do
	  fname=$(basename $framework .framework)
	  echo $fname
	  nm $framework/$fname | grep UIWeb
	done
	```
* OK, 根据打印信息, 可以清楚的看到哪些framework是罪魁祸首了

### 所以最后的解决方案, 要么更换那些使用了UIWebView的framework, 要么就等着framework的发布方更新版本, 毕竟没人想违背苹果爸爸的意愿
1
