import fs from 'fs';
const {default: mermaid} = await import('mermaid');
let bad=0;
for (const f of ['atividade.html','er.html','conexao.html'].map(x=>'/home/ubuntu/little-paw-coffee/docs/'+x)) {
  const s=fs.readFileSync(f,'utf8'); const re=/<pre class="mermaid">([\s\S]*?)<\/pre>/g; let m;
  while((m=re.exec(s))){ try{ await mermaid.parse(m[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>')); console.log(f,'OK'); }catch(e){bad++;console.log(f,'ERR',e.message.slice(0,200));} }
}
process.exit(bad);
