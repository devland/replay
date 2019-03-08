const replay=function()
{
 this.getElementIdentifier=(element)=>
 {
  if (element.id) return {type: 'id', value: element.id};
  else
  {
   return 'todo';
  }
 }
 this.getElementByIdentifier=(identifier)=>
 {
  if (typeof identifier!='object') return false;
  switch(identifier.type)
  {
   case 'id':
    return document.getElementById(identifier.value);
   break;
   case 'xpath':
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
   break;
  }
 }
}
