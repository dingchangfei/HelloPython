import urllib.request
import urllib



url = 'http://www.sina.com.cn/'

urlop = urllib.request.urlopen(url)
data = urlop.read().decode('utf-8')
print(data)