const replay=function()
{
 this.getElementIdentifier=(element)=>
 {
  if (element.id) return {type: 'id', value: element.id};
  else
  {
   let list=[], index;
   let previousElement=element, previousSibling;
   while(previousElement)
   {
    index=1;
    previousSibling=previousElement.previousElementSibling;
    while(previousSibling)
    {
     if (previousSibling.nodeName==element.nodeName) index++;
     previousSibling=previousSibling.previousElementSibling;
    }
    list.push(`/${previousElement.nodeName.toLowerCase()}[${index}]`);
    previousElement=previousElement.parentElement;
   }
   return {type: 'xpath', value: list.reverse().join('')};
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
    return document.evaluate(identifier.value, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
   break;
  }
 }
}
