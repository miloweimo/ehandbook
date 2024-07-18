/**
 * @author: Wei Mo
 * @date: 2024-07-18
 * @description: 读取显示文件列表，支持图片、pdf、纯文本文件
 * @usage: node ehandbook.js
 * @version: 0.0.1
 */
// 调试启动: nodemon index.js
// 引入库 读取本地文件列表
const fs = require('fs');
const path = require('path');
// 引入http模块
const http = require('http');

const PORT = 3000;

// 当前路径
const curpath = path.resolve(__dirname);
// console.log('当前路径:' + curpath);

// 当前路径下文件 排除文件夹
const files = fs
  .readdirSync(curpath)
  .filter((file) => {
    return !fs.statSync(path.join(curpath, file)).isDirectory();
  });
// console.log('当前路径下文件:' + files);


// 创建http对象
const app = (req, res) => {
  const headers = {
    'Access-Control-Allow-Origin': '*', /* @dev First, read about security */
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
    'Access-Control-Max-Age': 2592000, // 30 days
    /** add other headers as per requirement */
  };


  console.log('INFO: 请求路径:' + req.url);
  // 对于每一个file新建一个路由返回这个文件内容
  files
    .forEach(async (file) => {
      const url = '/' + encodeURIComponent(file);
      // // debug large pdf
      // if (file.includes('d11')) {
      //   console.log('当前url', url, '\n请求地址', req.url, '\n', url === req.url);
      // }
      if (req.url === url) {
        // 根据file文件类型返回对应类型
        const type = file.split('.').pop();
        switch (type.toLowerCase()) {
          case 'jpg':
          case 'png':
            console.log('INFO: 图片类型');
            res.writeHead(200, { ...headers, 'Content-Type': 'image/jpeg' });
            const imgdata = fs.readFileSync(path.join(curpath, file));
            const imgstream = res;
            imgstream.write(imgdata, (err) => {
              if (err) {
                console.error('ERROR: 写入出错:', err);
                return;
              }
              // console.log('第一次写入完成');
            });
          
            imgstream.end((err) => {
              if (err) {
                console.error('ERROR: 结束响应出错:', err);
                return;
              }
            });
            break;
          case 'pdf':
            console.log('INFO: PDF');
            res.writeHead(200, {
              ...headers, 'Content-Type': 'application/pdf'
            });
            const pdfdata = fs.readFileSync(path.join(curpath, file));
            const pdfstream = res;
            pdfstream.write(pdfdata, (err) => {
              if (err) {
                console.error('ERROR: 写入出错:', err);
                return;
              }
            });
          
            pdfstream.end((err) => {
              if (err) {
                console.error('ERROR: 结束响应出错:', err);
                return;
              }
            });
            break;
          default:
            console.log('INFO: 默认文件类型', type);
            res.writeHead(200, {
              ...headers, 'Content-Type': 'text/html;charset=utf-8'
            });
            await res.write(fs.readFileSync(path.join(curpath, file)));
            res.end();
        }
      }
    });

  if (files.includes(decodeURIComponent(req.url.replace('/', '')))) {
    console.log('INFO: 文件存在运行文件逻辑');
    return;
  }
  console.log('INFO: 文件不存在，请求地址:', decodeURIComponent(req.url.replace('/', '')));

  switch (req.url) {
    case '/':
      res.writeHead(200, {
        ...headers, 'Content-Type': 'text/html;charset=utf-8'
      });
      res.end(`<html><body>${files.map((file) => `<a href="/${encodeURIComponent(file)}">${file}</a>`).join('<br/>')}</body></html>`);
      break;
    case '/api/list':
      res.writeHead(200, {
        // 返回json格式，用utf-8编码，否则中文会乱码
        ...headers, 'Content-Type': 'application/json;charset=UTF-8'
      });
      res.end(JSON.stringify(files));
      break;
    default:
      res.writeHead(404, {
        ...headers, 'Content-Type': 'text/html;charset=utf-8'
      });
      res.end('<html><h1>404🤔</h1><p>即将跳转..</p><script>console.log("404");setTimeout(() => {window.location.pathname="/"}, 2000);</script></html>');
      break;
  }
};

http.createServer(app).listen(PORT);

console.log(`server is running at http://[::]:${PORT} http://127.0.0.1:${PORT}`);
