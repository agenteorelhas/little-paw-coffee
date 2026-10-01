(function(){
  'use strict';
  var paginas=[['index.html','Início'],['escopo.html','Escopo e Estrutura'],['atividade.html','Diagramas de Atividade'],['er.html','Diagrama ER'],['conexao.html','Conexão com o Banco'],['estrutura.html','Arquivos e Padrões']];
  var nav=document.getElementById('nav-docs');
  if(nav){
    var atual=location.pathname.split('/').pop()||'index.html';
    var h=document.createElement('h2');h.textContent='🐾 Little Paw Coffee — Docs';nav.appendChild(h);
    var ul=document.createElement('ul');
    paginas.forEach(function(p){var li=document.createElement('li'),a=document.createElement('a');a.href=p[0];a.textContent=p[1];if(p[0]===atual)a.setAttribute('aria-current','page');li.appendChild(a);ul.appendChild(li);});
    var li=document.createElement('li'),a=document.createElement('a');a.href='../index.html';a.textContent='← Voltar ao site';li.appendChild(a);ul.appendChild(li);
    nav.appendChild(ul);
  }
  if(window.mermaid){
    mermaid.initialize({startOnLoad:true,securityLevel:'strict',theme:'base',themeVariables:{primaryColor:'#FDF6E3',primaryTextColor:'#2B1A10',primaryBorderColor:'#5C2D0E',lineColor:'#5C2D0E',secondaryColor:'#F3E6CC',tertiaryColor:'#FFFDF7',fontFamily:'system-ui, sans-serif'}});
  }
  if(window.hljs){hljs.highlightAll();}
})();
