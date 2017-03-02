import requests
import os
import shutil
import logging
import json
from bs4 import BeautifulSoup


def mkdirs(log_file):
    prefix = os.path.dirname(log_file)
    if not os.path.exists(prefix):
        os.makedirs(prefix)


def createLogger(logger_name, log_file):
    mkdirs(log_file)
    # 创建一个logger
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.INFO)
    # 创建一个handler，用于写入日志文件
    fh = logging.FileHandler(log_file)
    # 再创建一个handler，用于输出到控制台
    ch = logging.StreamHandler()
    # 定义handler的输出格式formatter
    formatter = logging.Formatter('%(asctime)s | %(name)s | %(levelname)s | %(message)s')
    fh.setFormatter(formatter)
    ch.setFormatter(formatter)
    # 给logger添加handler
    logger.addHandler(fh)
    logger.addHandler(ch)
    #logger = logger
    return logger

headers = {
    'Accept': '*/*',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://www.zhihu.com/',
    'Accept-Language': 'en-GB,en;q=0.8,zh-CN;q=0.6,zh;q=0.4',
    'Accept-Encoding': 'gzip, deflate, br',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36',
    'Host': 'www.zhihu.com'
}

username = '.com'
password = ''

homepage = "https://www.zhihu.com"

soup = BeautifulSoup(requests.get(homepage,headers = headers).text, "html.parser")
_xsrf = soup.find("input", {"name": "_xsrf"})['value']


captchaURL = r"https://www.zhihu.com/captcha.gif?type=login"  # 验证码url
outpath = "temp/captcha.jpg";

mkdirs(outpath)

picture = requests.get(captchaURL, headers = headers, stream=True)
with open(outpath, 'wb') as out_file:
    shutil.copyfileobj(picture.raw, out_file)
del picture

loginUrl = r"https://www.zhihu.com/login/email"

post_data = {
    '_xsrf': _xsrf,
    'account_name': username,
    'password': password,
    'remember_me': 'true',
    'captcha': input("Please input captcha: ")
}

logger = createLogger('mylogger', 'temp/logger.log')

resText = requests.get(loginUrl,post_data,headers=headers).text
print(resText)
# jsonText = json.loads(resText)
#
# if jsonText["r"] == 0:
#     logger.info("Login success!")
# else:
#     logger.error("Login Failed!")
#     logger.error("Error info ---> " + jsonText["msg"])

text = requests.get(homepage,headers=headers).text

print(text)
