import re
import urllib.request
import urllib
import http.cookiejar

from collections import deque


queue = deque()
visited = set()

url = 'http://www.sina.com.cn/'  # 入口页面, 可以换成别的

queue.append(url)
cnt = 0


# head: dict of header；
def makeMyOpener(head={
    'Connection': 'Keep-Alive',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Encoding':'gzip, deflate, sdch',
    'Accept-Language': 'zh-CN,zh;q=0.8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36'
}):
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    header = []
    for key, value in head.items():
        elem = (key, value)
        header.append(elem)
    opener.addheaders = header
    return opener


oper = makeMyOpener()

while queue:
    url = queue.popleft()  # 队首元素出队
    visited |= {url}  # 标记为已访问

    print('已经抓取: ' + str(cnt) + '   正在抓取 <---  ' + url)
    cnt += 1

    try:
        uop = urllib.request.urlopen(url, timeout=1000)
        if 'html' not in uop.getheader('Content-Type'):
            continue
    except:
        print('脏链接：'+ url)
        continue

    # 避免程序异常中止, 用try..catch处理异常
    try:
        data = uop.read().decode('utf-8')
    except:
        continue

    # 正则表达式提取页面中所有队列, 并判断是否已经访问过, 然后加入待爬队列
    linkre = re.compile('href="(.+?)"')
    for x in linkre.findall(data):
        if 'http' in x and x not in visited and 'bluecoat.com' not in x:
            queue.append(x)
            print('加入队列 --->  ' + x)