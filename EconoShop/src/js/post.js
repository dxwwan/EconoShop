var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring')

function templateHTML(title, list, body, option) {
  return `
  <!doctype html>
  <html>
  <head>
    <title>Econo shop - ${title}</title>
    <meta charset="utf-8">
  </head>
  <body>
    <h1><a href="/">글 목록</a></h1>
    ${list}
    ${option}
    ${body}
  </body>
  </html>`;
}

function templateList(postlist) {
  var list = '<ul>';
  var i = 0;
  while (i < postlist.length) {
    list = list + `<li><a href="/?id=${postlist[i]}">${postlist[i]}</a></li>`;
    i = i + 1;
  }
  list = list + '</ul>';
  return list;
}

var app = http.createServer(function(request, response) {
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;

  if (pathname === '/') {
    if (queryData.id === undefined) {
      fs.readdir('./data', function(error, postlist) {
        var title = 'Flea Market';
        var list = templateList(postlist);
        var template = templateHTML(title, list, 
        ``, `<a href="/create">새 글 작성</a>`);
        response.writeHead(200);
        response.end(template);
      });
    } 
    else {
      fs.readdir('./data', function(error, postlist) {
        fs.readFile(`data/${queryData.id}`, 'utf8', function(err, description) {
          var title = queryData.id;
          var list = templateList(postlist);
          var template = templateHTML(title, list, `<h2>${title}</h2><p>${description}</p>`,
          `<a href="/create">새 글 작성</a> <a href="/update?id=${title}">수정</a> 
          <form action="delete_process" method="post">
            <input type="hidden" name="id" value="${title}">
            <input type="submit" value="삭제">
          </form>`);
          response.writeHead(200);
          response.end(template);
        });
      });
    }
  } 
  else if(pathname === '/create'){
    fs.readdir('./data', function(error, postlist) {
      var title = 'Flea Market - 새 글 작성';
      var list = templateList(postlist);
      var template = templateHTML(title, list, `
        <form action="/create_process" method="post">
          <p><input type="text" name="title" placeholder="title"></p>
          <p>
            <textarea name="description" placeholder="description"></textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
      `,'');
      response.writeHead(200);
      response.end(template);
    });
  }
  else if(pathname === '/create_process'){
    var body = '';
    request.on('data', function(data){
      body = body + data;
    });
    request.on('end', function(){
      var post = qs.parse(body);
      /*console.log(post)*/
      var title = post.title;
      var description = post.description;
      fs.writeFile(`data/${title}`, description, 'utf8', function(err){
        response.writeHead(302, {Location: encodeURI(`/?id=${title}`)});
        response.end('success');
      })
    });
  }
  else if(pathname === '/update'){
    fs.readdir('./data', function(error, postlist) {
      fs.readFile(`data/${queryData.id}`, 'utf8', function(error, description){
      var title = queryData.id;
      var list = templateList(postlist);
      var template = templateHTML(title, list, 
        `
        <form action="/update_process" method="post">
          <input type="hidden" name="id" value="${title}">
          <p><input type="text" name="title" placeholder="title" value="${title}"></p>
          <p>
            <textarea name="description" placeholder="description">${description}</textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
      `,
      `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`);
      response.writeHead(200);
      response.end(template);
      });
    });
  }
  else if(pathname ==='/update_process'){
    var body = '';
    request.on('data', function(data){
      body = body + data;
    });
    request.on('end', function(){
      var post = qs.parse(body);
      var id = post.id;
      var title = post.title;
      var description = post.description;
      fs.rename(`data/${id}`, `data/${title}`, function(err){
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){
          response.writeHead(302, {Location: encodeURI(`/?id=${title}`)});
          response.end();
        })
      });
    });
  }
  else if(pathname ==='/delete_process'){
    var body = '';
    request.on('data', function(data){
      body = body + data;
    });
    request.on('end', function(){
      var post = qs.parse(body);
      var id = post.id;
      fs.unlink(`data/${id}`, function(error){
        response.writeHead(302, {Location: `/`});
        response.end();
      })
    });
  }
  else {
    response.writeHead(404);
    response.end('Not found');
  }
});

app.listen(3000);
