window.addEventListener("load", (event)=>
{
 const tester=new replay();
 const element=document.getElementById('cheeseCake');
 let xpath=tester.getElementXPath(element);
 console.log(element);
 console.log(xpath);
 console.log(tester.getElementByXPath(xpath));
});
