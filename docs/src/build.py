import re, html, pathlib
d = pathlib.Path(__file__).parent
head, foot = (d/'head.tpl').read_text(), (d/'foot.tpl').read_text()
schema = (d.parent.parent/'database/schema.sql').read_text()
blocks = re.findall(r'(CREATE TABLE (\w+) \(.*?\n\);)', schema, re.S)
sql = ''.join(f'<h3>{i}.{n}</h3>\n<pre><code class="language-sql">{html.escape(b)}</code></pre>\n'.replace(f'{i}.{n}', f'2.{i} {n}') for i,(b,n) in enumerate(blocks,1))
alters = '\n'.join(re.findall(r'ALTER TABLE.*?;', schema))
sql += f'<h3>2.10 Evolução do esquema (ALTER TABLE)</h3>\n<pre><code class="language-sql">{html.escape(alters)}</code></pre>\n'
pages = {'index':'Início','escopo':'Escopo e Estrutura','atividade':'Diagramas de Atividade','er':'Diagrama Entidade-Relacionamento','conexao':'Conexão com o Banco de Dados','estrutura':'Arquivos e Padrões'}
for p,t in pages.items():
    body = (d/f'{p}.body').read_text().replace('__SQL__', sql)
    (d.parent/f'{p}.html').write_text(head.replace('__TITULO__', t) + body + foot)
print(len(blocks), 'tables')
