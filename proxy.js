const protocols=
 {
  "http:": require("http"),
  "https:": require("https")
 },
 port=process.argv[2] || 8080,
 url=require("url"),
 util=require("util"),
 fs=require("fs"),
 extra=require("./extra.js");
 let targetUrl=new URL("http://example.com");
 let proxyUrl=new URL(`http://127.0.0.1:${port}/`);
 let staticFiles=["replay.html", "replay.js", "extra.js"];
 let proxyTarget={};
const log=function()
{
 var now=new Date(), line="["+now+" ."+now.getMilliseconds()+"]: ";
 for (let i in arguments)
  if (typeof arguments[i] == "string") line+=arguments[i];
  else
  {
   console.log(line);
   line="";
   console.log(util.inspect(arguments[i], false, null, true));
  }
  if (line) console.log(line);
}
const tunnel=(url)=>
{
 if (!url) return "";
 if (url.includes(proxyUrl.href)) url=url.substring(proxyUrl.href.length);
 let destination;
 try
 {
  destination=new URL(url);
 }
 catch(error)
 {
  destination=new URL(url, `${proxyTarget.protocol}//${proxyTarget.host}`);
 }
 return proxyUrl.href+destination.href;
}
const proxy=(request, response)=>
{
 let cookies=extra.cookies.parse(request.headers.cookie);
 if (cookies.proxyTargetHref) proxyTarget=url.parse(cookies.proxyTargetHref);
 let targetUrl=url.parse(request.url.substring(1), true);
 if (proxyTarget.host!=targetUrl.host)
  targetUrl=url.parse(`${proxyTarget.protocol}//${proxyTarget.host}/${targetUrl.href.replace(/https?:\/\//, "")}`);
 if (cookies.proxyTargetHref)
 {
  delete cookies.proxyTargetHref;
  request.headers.cookie=extra.cookies.stringify(cookies);
 }
 let targetUrlOptions=
 {
  host: targetUrl.host,
  port: targetUrl.protocol==="https:"?443:80,
  path: targetUrl.path,
  method: request.method,
  headers: request.headers,
  timeout: 10000
 }
 if (targetUrlOptions.headers)
 {
  delete targetUrlOptions.headers.referer;
  delete targetUrlOptions.headers.host;
  if (targetUrlOptions.headers["accept-encoding"]) targetUrlOptions.headers["accept-encoding"]="identity";
 }
 if (!targetUrl) targetUrl={href: null};
 log(`proxying request to "${targetUrl.href}"`);
 if (protocols[targetUrl.protocol])
 {
  const proxyRequest=protocols[targetUrl.protocol].request(targetUrlOptions, (result)=>
  {
   delete result.headers["x-frame-options"];
   delete result.headers["content-security-policy"];
   if (Array.isArray(result.headers["set-cookie"]))
    for (let i=0; i<result.headers["set-cookie"].length; i++)
    {
     result.headers["set-cookie"][i]=result.headers["set-cookie"][i].replace(/domain=(.*?)((; )|$)/, "");
     result.headers["set-cookie"][i]=result.headers["set-cookie"][i].replace(/ secure((; )|$)/, "");
    }
   //log(`response headers for "${targetUrl.href}"`, result.headers);
   if (result.headers.location)
   {
    log(`redirecting to ${result.headers.location}`);
    const location=url.parse(result.headers.location);
    if (!location.host)
    {
     let newLocation=url.resolve(targetUrl.href, result.headers.location);
     result.headers.location=proxyUrl.href+newLocation;
     proxyTarget=url.parse(newLocation);
    }
    else
    {
     proxyTarget=url.parse(result.headers.location);
     result.headers.location=proxyUrl.href+result.headers.location;
    }
    if (!Array.isArray(result.headers["set-cookie"])) result.headers["set-cookie"]=[];
    result.headers["set-cookie"].push(`proxyTargetHref=${proxyTarget.href}; path=/`);
    response.writeHead(result.statusCode, result.headers);
    result.on("data", (chunk)=>
    {
     response.write(chunk);
    });
    result.on("end", (chunk)=>
    {
     response.end();
    });
   }
   else
   {
    result.headers["Access-Control-Allow-Origin"]="*";
    log(`proxy request response status code for "${targetUrl.href}": ${result.statusCode}`);
    response.writeHead(result.statusCode, result.headers);
    let body=null;
    let isHtml=false;
    if (result.headers["content-type"] && result.headers["content-type"].indexOf("html")!=-1)
    {
     isHtml=true;
     body="";
    }
    result.on("data", (chunk)=>
    {
     if (isHtml) body+=chunk.toString();
     else response.write(chunk);
    });
    result.on("end", (chunk)=>
    {
     if (isHtml) body=body.replace(/<script(.*?)src="(.*?)"/g, (match, chunk_1, chunk_2, offset, string)=>
     {
      return `<script${chunk_1}src="${tunnel(chunk_2)}"`;
     });
     response.end(body);
    });
   }
  });
  proxyRequest.on("error", (error)=>
  {
   log(`proxy request error for ${targetUrl.href}`, error);
   response.writeHead(500);
   response.end();
  });
  proxyRequest.end();
 }
 else
 {
  log(`no protocol for ${targetUrl.href}`);
  response.writeHead(500);
  response.end();
 }
}
process.on("error", (error)=>
{
 log(`[error] process error`, error);
});
const requestHandler=(request, response)=>
{
 //log("request headers:", request.headers);
 let path=request.url;
 request.on("error", (error)=>
 {
  log("[error]", error);
  response.end(error);
 });
 let fileName="";
 extra.cascade(
 [
  (next)=>
  {
   var parts=path.split("/");
   for (var i=0; i<parts.length; i++) if (!parts[i]) parts.splice(i, 1);
   fileName=parts.join("/");
   next(null);
  },
  (next)=>
  {
   if (!staticFiles.includes(fileName)) return next("proxy");
   var benchmarkStart = new Date();
   fs.readFile(fileName, "binary", (error, result)=>
   {
    if (error) next(error);
    else
    {
     next(null, result);
     var benchmarkEnd = new Date();
     log("served file "+fileName, (" ("+(benchmarkEnd-benchmarkStart)/1000+" s)"));
    }
   });
  }
 ],
 (error, result)=>
 {
  if (error)
  {
   if (error=="proxy")
   {
    const targetUrl=url.parse(request.url.substring(1), true);
    proxy(request, response);
   }
   else
   {
    log("error", error);
    response.write(error + "\n");
    response.end();
   }
  }
  else
  {
   response.writeHead(200);
   response.write(result, "binary");
   response.end();
  }
 });
}
protocols["http:"].createServer(requestHandler).listen(parseInt(port, 10));
log("static file server running at http://localhost:"+port);
