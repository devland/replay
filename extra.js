function extra()
{
 var self=this;
 this.cascade=function(methods, callback)
 {
  var index=0,
      hasCallback=false;
  if (typeof callback=="function") hasCallback=true;
  if (!methods || !methods.length)
   if (hasCallback) callback("cascade:no_methods");
   else
   {
    console.log("cascade:no_methods");
    return;
   }
  var next=function()
  {
   index++;
   if (typeof arguments[0]!="undefined" && arguments[0]!=null)
   {
    if (hasCallback) callback(arguments[0]);
   }
   else if (index<methods.length) run.apply(null, arguments);
   else if (hasCallback) callback.apply(null, arguments);
  }
  var run=function()
  {
   arguments[0]=next;
   if (typeof methods[index]=="function")
   {
    var args=[];
    for (var i in arguments) args.push(arguments[i]);
    methods[index].apply(null, args);
   }
  }
  run();
 }
 this.cookies={
  parse: (input)=>
  {
   let list=input.split(';');
   let output={};
   for (item of list)
   {
    matches=item.match(/ ?(.*?)=(.*?)(;|$)/);
    if (matches && matches.length>=4) output[matches[1]]=matches[2];
   }
   return output;
  },
  stringify: (cookies)=>
  {
   let list=[];
   for (key in cookies) list.push(`${key}=${cookies[key]}`);
   return list.join(';');
  }
 }
}
if (typeof module!="undefined" && module.exports) module.exports=new extra();
