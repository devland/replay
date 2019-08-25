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
}
if (typeof module!="undefined" && module.exports) module.exports=new extra();
