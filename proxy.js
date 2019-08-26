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
 let rootTargetHref="http://example.com";
 let targetUrl=new URL("http://example.com");
 let proxyUrl=new URL("http://127.0.0.1:8080/");
 let staticFiles=["replay.html", "replay.js"];
const log=function()
{
 var now=new Date(),
     line="["+now+" ."+now.getMilliseconds()+"]: ";
 for (var i in arguments)
  if (typeof arguments[i] == "string") line+=arguments[i];
  else
  {
   console.log(line);
   line="";
   console.log(util.inspect(arguments[i], false, null, true));
  }
  if (line) console.log(line);
}
const encode=(value)=>
{
 return encodeURIComponent(JSON.stringify({url: value}));
}
const decode=(value)=>
{
 let output;
 try
 {
  output=decodeURIComponent(value);
  output=JSON.parse(output);
  return output.url?output.url:null;
 }
 catch(error){return null;}
}
const proxy=(request, response)=>
{
 let target=url.parse(request.url, true);
 const decoded=decode(target.pathname.substring(1));
 let targetUrl='';
 if (decoded)
 {
  targetUrl=url.parse(decoded, true);
  if (targetUrl.host) rootTargetHref=targetUrl.href;
  else targetUrl=url.parse(url.resolve(rootTargetHref, decoded));
 }
 else targetUrl=url.parse(url.resolve(rootTargetHref, request.url));
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
 }
 //log("request options", targetUrlOptions);
 if (!targetUrl) targetUrl={href: null};
 //log(`proxying request to "${targetUrl.href}"`);
 let responseTargetUrl=`${targetUrl.protocol}//${targetUrlOptions.host}${targetUrlOptions.path}`;
 const proxyRequest=protocols[targetUrl.protocol].request(targetUrlOptions, (result)=>
 {
  //log(`response headers for "${responseTargetUrl}"`, result.headers);
  if (result.headers.location)
  {
   log(`redirecting to ${result.headers.location}`);
   const location=url.parse(result.headers.location);
   if (!location.host)
    result.headers.location=proxyUrl.href+encode(url.resolve(rootTargetHref, result.headers.location));
   else
    result.headers.location=proxyUrl.href+encode(result.headers.location);
   response.writeHead(result.statusCode, result.headers);
   result.pipe(response);
  }
  else
  {
   result.headers["Access-Control-Allow-Origin"]="*";
   //log(`proxy request response status code for "${responseTargetUrl}": ${result.statusCode}`);
   response.writeHead(result.statusCode, result.headers);
   result.pipe(response);
  }
 });
 proxyRequest.on("error", (error)=>
 {
  log(error);
 });
 return proxyRequest;
}
process.on("error", (error)=>
{
 log(`[error] process error`, error);
});
protocols["http:"].createServer((request, response)=>
{
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
   if (error=="proxy") request.pipe(proxy(request, response));
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
}).listen(parseInt(port, 10));
log("static file server running at http://localhost:"+port);
