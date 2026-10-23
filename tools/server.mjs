import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let target=path.resolve(root,'.'+pathname);
    if(!target.startsWith(root+path.sep)&&target!==root)throw Error('outside');
    if(path.basename(target).startsWith('.')||pathname.split('/').some(part=>part.startsWith('.'))){res.writeHead(403);res.end();return;}
    if((await stat(target)).isDirectory())target=path.join(target,'index.html');
    const data=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]??'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log(`Contrapeso: http://127.0.0.1:${server.address().port}`));
