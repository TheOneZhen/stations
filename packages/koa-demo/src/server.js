import { Application } from "./application.js";

const app = new Application()

app.use((ctx) => {
  if (ctx.path === '/get') {
    console.log(ctx.query);
    ctx.body = "Hello World get"
  }else if(ctx.path === '/post'){
    ctx.body = "Hello World post"
  }
  
})
app.listen(3000, () => {
  console.log('server start 3000')
})
