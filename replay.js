const replay=function()
{
 this.getElementXPath=(element)=>
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
  return list.reverse().join('');
 }
 this.getElementByXPath=(xpath)=>
 {
  return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
 }
}
