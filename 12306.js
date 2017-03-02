var http=require("http"),https=require("https"),fs=require("fs");
var exec = require('child_process').execFile;
var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.89 Safari/537.36";
//从12306获取图片
getImg().then(function(){
  // 改变图片尺寸
  return resizeImg();
}).then(function(){
  // 把图片裁剪成8个小图片
  return cropImg();
}).then(function(){
  // 上传到百度识图
  return toBaidu();
}).then(function(result){
  // 获取结果
  console.log(result);
}).catch(function(err){
  console.error(err);
})

// 获取12306图片并保存
function getImg(){
  var options = {
      host:'kyfw.12306.cn',
      port:443,
      method:'GET',
      rejectUnauthorized:false,
      path:'/otn/passcodeNew/getPassCodeNew?module=login&rand=sjrand&0.21191171556711197',
      headers:{
          'Connection':'keep-alive',
          'Host':'kyfw.12306.cn',
          'User-Agent': UA
      }
  };
  return new Promise(function(resolve,reject){
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    var req=https.request(options,function(res){
      var bufferArr=[];
      res.on("data",function(data){
        bufferArr.push(data);
      });
      res.on("end",function(){
        var buffer=Buffer.concat(bufferArr);
        fs.writeFile("./test.jpg",buffer,function(err){
          if(err)reject(err);
          resolve(true);
        })
      })
    }).on("error",function(err){
      reject(err);
    });
    req.end();
  })
}
//放大图片尺寸
function resizeImg(){
  var args=["-resize","440","./test.jpg","./new_test.jpg"];
  return new Promise(function(resolve,reject){
    exec("convert",args,function(err,stdout,stderr){
      if(err)reject(err)
      else
      resolve(stdout);
    })
  })
}

// 8次并行获取关键字
function toBaidu(){
  var arr=[];
  arr.length=8;
  return eachCallback(arr,function(val,key,callback){
    var filesrc="./test_"+key+".jpg";
    getBaiduImg(filesrc).then(function(imgsrc){
      return getBDRes(imgsrc);
    }).then(function(keywords){
      callback(keywords);
    }).catch(function(err){
      callback(err);
    })
  });
}

// 上传图片到百度的地址
function getBaiduImg(filesrc){
  var url = "http://stu.baidu.com/n/image?fr=html5&needRawImageUrl=true&id=WU_FILE_0&name=233.png&type=image%2Fpng&lastModifiedDate=Mon+Mar+16+2015+20%3A49%3A11+GMT%2B0800+(CST)&size=";
  var boundaryKey = '----' + new Date().getTime();
  return new Promise(function(resolve,reject){
    fs.readFile(filesrc,function(err,fsdata){
      if(err)return reject(err);
      var options = {
        host:'stu.baidu.com',
        port:80,
        method:'POST',
        path:'/n/image?fr=html5&needRawImageUrl=true&id=WU_FILE_0&name=233.png&type=image%2Fpng&lastModifiedDate=Mon+Mar+16+2015+20%3A49%3A11+GMT%2B0800+(CST)&size='+fsdata.length,
        headers:{
            'Content-Type':'image/jpeg',
            'Connection':'close',
            'Host' : 'stu.baidu.com',
            'Content-Length':fsdata.length,
            'User-Agent': UA
        }
      };
      var request=http.request(options,function(res){
        var bufferArr=[];
        res.on("data",function(data){
          bufferArr.push(data);
        });
        res.on("end",function(){
            resolve(Buffer.concat(bufferArr).toString());
        })
      }).on("error",function(err){
        reject(err);
      });
      request.end(fsdata);
    })

  })
}

// 通过上传的url获取到百度识图的返回页面
function getBDRes(imgurl){
  var url = "http://stu.baidu.com/n/searchpc?queryImageUrl=" + escape(imgurl);
  return new Promise(function(resolve,reject){
    http.get(url,function(res){
      var bufferArr=[];
      res.on("data",function(data){
        bufferArr.push(data);
      });
      res.on("end",function(){
        var data=Buffer.concat(bufferArr).toString();
        var keyword=getKeyWord(data);
        resolve(keyword);
      })
    }).on("error",function(err){
      reject(err);
    })
  })
}
// 从返回页面获取keyword
function getKeyWord(html){
  var match=html.match(/keywords:'(.*?)'/);
  if(match && match[1]){
    var jsonstr=match[1].replace(/\\x22/g,'"');
    try{
       var json=JSON.parse(jsonstr);
       var result=json.map(function(val){
        var keyword="";
        eval('keyword="'+val.keyword+'"');
        return keyword;
       })
      return result;
    }catch(err){

    }
  }
  return null;
}

// 获取切割位置
function getCropSize(){
  var arr=[];
  for(var j=0;j<2;j++){
    for(var i=0;i<=3;i++){
      var left = 8 + (100 + 5) * i;
      var top = 61 + (100 + 5) * j;
      arr.push("100x100+"+left+"+"+top);   
    }
  }
  return arr;
}
// 分割小图片
function cropImg(){
  var sizeArr=getCropSize();
  var promise = eachCallback(sizeArr,function(val,key,callback){
      var args=["./new_test.jpg","-crop"];
      args.push(val);
      args.push("./test_"+key+".jpg");
      exec("convert",args,function(err,stdout,stderr){

        if(err)callback(err);
        else callback(stdout);
      })
    });
  return promise;
}

// 数组异步并发循环
function eachCallback(arr,func){
  return new Promise(function(resolve,reject){
    if(!arr || !arr.length){
       resolve(arr);
       return;
    }
    var s=arr.length;
    var resultArr=[];
    function done(data){
      var key = this.key;
      resultArr[key]=data;
      s--;
      if(s==0)resolve(resultArr);
    }
    for(var i=0;i<arr.length;i++){
      var newdone=done.bind({key:i});
      func.call(null,arr[i],i,newdone);
    }
  })
}