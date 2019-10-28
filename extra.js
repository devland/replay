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
   if (!input) return {};
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
 this.bindProperties=function(firstObject, firstProperty, secondObject, secondProperty)
 {
  if (typeof firstObject!="object" || typeof secondObject!="object" ||
      typeof firstProperty!="string" || typeof secondProperty!="string")
  {
   console.log("invalid input for bindProperties method");
   return;
  }
  var getProtoDesc=function(object, property)
  {
   var output=
   {
    prototype: object,
    descriptor: null
   };
   output.descriptor=Object.getOwnPropertyDescriptor(output.prototype, property);
   if (output.descriptor) return output;
   else return getProtoDesc(Object.getPrototypeOf(output.prototype), property);
  }
  var bind=function(protoDesc, oldProtoDesc, property, otherProtoDesc, otherObject, otherProperty)
  {
   if (protoDesc.descriptor.writable)
   {
    delete protoDesc.descriptor.writable;
    protoDesc.ownValue=protoDesc.descriptor.value;
    delete protoDesc.descriptor.value;
    protoDesc.descriptor.get=function()
    {
     return protoDesc.ownValue;
    }
   }
   protoDesc.descriptor.configurable=true;
   protoDesc.descriptor.set=function()
   {
    console.log(arguments[0]);
    if (typeof protoDesc.ownValue!="undefined") protoDesc.ownValue=arguments[0];
    if (!protoDesc.noBind)
    {
     otherProtoDesc.noBind=1;
     otherObject[otherProperty]=arguments[0];
    }
    else protoDesc.noBind=0;
    if (typeof oldProtoDesc.descriptor.set=="function") oldProtoDesc.descriptor.set.apply(this, arguments);
   }
   Object.defineProperty(protoDesc.prototype, property, protoDesc.descriptor);
  }
  var firstOldProtoDesc=getProtoDesc(firstObject, firstProperty),
      secondOldProtoDesc=getProtoDesc(secondObject, secondProperty),
      firstProtoDesc=getProtoDesc(firstObject, firstProperty),
      secondProtoDesc=getProtoDesc(secondObject, secondProperty);
  console.log(firstProtoDesc.descriptor.set);
  console.log(secondProtoDesc.descriptor.set);
  bind(firstProtoDesc, firstOldProtoDesc, firstProperty, secondProtoDesc, secondObject, secondProperty);
  bind(secondProtoDesc, secondOldProtoDesc, secondProperty, firstProtoDesc, firstObject, firstProperty);
  console.log(firstProtoDesc.descriptor.set);
  console.log(secondProtoDesc.descriptor.set);
  console.log("cheese");
 }
}
if (typeof module!="undefined" && module.exports) module.exports=new extra();
